import { z } from "zod";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const sendChatMessage = baseProcedure
  .input(z.object({
    sessionId: z.number(),
    message: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log("sendChatMessage called with:", input);

    // Verify session exists
    const session = await db.session.findUnique({
      where: { id: input.sessionId },
      include: { messages: true },
    });

    console.log("Found session:", session);

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session not found",
      });
    }

    if (session.status !== "active") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Session is not active",
      });
    }

    // Save user message
    await db.message.create({
      data: {
        sessionId: input.sessionId,
        role: "user",
        content: input.message,
      },
    });

    try {
      // Create a thread if it doesn't exist, or use existing thread
      let threadId = session.openaiThreadId;

      if (!threadId) {
        const thread = await openai.beta.threads.create();
        threadId = thread.id;

        // Update session with thread ID
        await db.session.update({
          where: { id: input.sessionId },
          data: { openaiThreadId: threadId },
        });
      }

      // Add the user message to the thread
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: input.message,
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: env.ASSISTANT_ID,
      });

      // Wait for the run to complete
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

      while (runStatus.status === "in_progress" || runStatus.status === "queued") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      if (runStatus.status === "failed") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Assistant run failed",
        });
      }

      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessage = messages.data.find(msg =>
        msg.role === "assistant" &&
        msg.run_id === run.id
      );

      if (!assistantMessage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No assistant response found",
        });
      }

      const content = assistantMessage.content[0];
      if (!content || content.type !== "text") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected response format from assistant",
        });
      }

      const assistantResponse = content.text.value;

      // Save assistant message
      await db.message.create({
        data: {
          sessionId: input.sessionId,
          role: "assistant",
          content: assistantResponse,
        },
      });

      return {
        success: true,
        content: assistantResponse,
      };

    } catch (error) {
      console.error("Error in sendChatMessage:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to process message",
      });
    }
  });
