import { z } from "zod";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const truncate = (str: string, len = 100) =>
  str.length > len ? `${str.slice(0, len)}…` : str;

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const MAX_RUN_POLL_RETRIES = 30; // Limit number of status checks

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
      console.log("Current thread id:", threadId);

      if (!threadId) {
        console.log("Creating new OpenAI thread");
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        console.log("Created thread", threadId);

        // Update session with thread ID
        await db.session.update({
          where: { id: input.sessionId },
          data: { openaiThreadId: threadId },
        });
      }

      // Add the user message to the thread
      console.log(
        "Adding message to thread",
        threadId,
        truncate(input.message)
      );
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: input.message,
      });
      console.log("Message added to thread", threadId);

      // Run the assistant
      console.log("Starting assistant run on thread", threadId);
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: env.ASSISTANT_ID,
      });
      console.log("Run started", run.id);
      console.log("Run object:", JSON.stringify(run, null, 2));

      if (!run.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create run - no run ID returned",
        });
      }

      // Wait for the run to complete with a timeout
      console.log("Retrieving run status for threadId:", threadId, "runId:", run.id);
      let runStatus = await (openai.beta.threads.runs.retrieve as any)(threadId, run.id);
      console.log("Initial run status", runStatus.status);
      let retries = 0;

      while (
        (runStatus.status === "in_progress" || runStatus.status === "queued") &&
        retries < MAX_RUN_POLL_RETRIES
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await (openai.beta.threads.runs.retrieve as any)(threadId, run.id);
        retries += 1;
        console.log(
          `Polling run status (${retries}/${MAX_RUN_POLL_RETRIES})`,
          runStatus.status
        );
      }

      if (runStatus.status === "in_progress" || runStatus.status === "queued") {
        throw new TRPCError({
          code: "TIMEOUT",
          message: "Assistant did not finish in time",
        });
      }

      if (runStatus.status === "failed") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Assistant run failed",
        });
      }

      console.log("Run completed with status", runStatus.status);

      // Get the assistant's response
      console.log("Fetching assistant messages");
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
      console.log("Assistant response:", truncate(assistantResponse));

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
