import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Mistral } from "@mistralai/mistralai";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const truncate = (str: string, len = 100) =>
  str.length > len ? `${str.slice(0, len)}…` : str;

const mistral = new Mistral({
  apiKey: env.MISTRAL_API_KEY,
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
      // Get all messages for this session from database
      const allMessages = await db.message.findMany({
        where: { sessionId: input.sessionId },
        orderBy: { createdAt: "asc" },
      });

      // Build messages array for Mistral
      const messageList = allMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Add the new user message to the list
      messageList.push({
        role: "user" as const,
        content: input.message,
      });

      console.log("Sending messages to Mistral agent:", messageList.length, "messages");
      console.log("Latest message:", truncate(input.message));

      // Call Mistral agent endpoint
      const response = await mistral.chat.completions.create({
        agent_id: env.MISTRAL_AGENT_ID,
        model: env.MISTRAL_MODEL,
        messages: messageList,
        max_tokens: 400,
        temperature: 0.5,
        stream: false,
      });

      const assistantResponse = response.choices?.[0]?.message?.content;

      if (!assistantResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No response from Mistral agent",
        });
      }

      console.log("Mistral agent response:", truncate(assistantResponse));

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
