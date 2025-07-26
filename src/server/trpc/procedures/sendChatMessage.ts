import { z } from "zod";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const streamingResponseSchema = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "The content of the streaming response"
    },
    type: {
      type: "string",
      enum: ["text", "complete"],
      description: "The type of response chunk"
    }
  },
  required: ["content", "type"]
};

const SOKRATES_SYSTEM_PROMPT = `Du er Sokrates, en AI-assistent som hjelper pasienter med å fylle ut en medisinsk anamnese gjennom sokratisk dialog. Din oppgave er å stille gjennomtenkte spørsmål for å samle informasjon om følgende områder:

1. Hovedplage - hva er pasientens primære bekymring
2. Tidligere sykdommer - medisinsk historie
3. Medisinering - nåværende og tidligere medisiner
4. Allergier - kjente allergier og reaksjoner
5. Familiehistorie - arvelige sykdommer i familien
6. Sosial livsstil - røyking, alkohol, mosjon, etc.
7. ROS (Review of Systems) - systematisk gjennomgang av organsystemer
8. Pasientmål - hva håper pasienten å oppnå
9. Fri oppsummering - andre relevante opplysninger

Stil ett spørsmål om gangen. Vær vennlig, empatisk og profesjonell. Ikke gi medisinske råd. Når du har samlet nok informasjon i alle områdene, avslutt samtalen høflig og takk pasienten.`;

export const sendChatMessage = baseProcedure
  .input(z.object({ 
    sessionId: z.number(),
    message: z.string(),
  }))
  .query(async function* ({ input }) {
    // Verify session exists
    const session = await db.session.findUnique({
      where: { id: input.sessionId },
      include: { messages: true },
    });

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

    // Prepare conversation history for OpenAI
    const messages = [
      { role: "system" as const, content: SOKRATES_SYSTEM_PROMPT },
      ...session.messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: input.message },
    ];

    // Stream response from OpenAI using Assistants API
    const stream = await openai.chat.completions.create({
      assistant_id: env.ASSISTANT_ID,
      messages,
      stream: true,
      response_format: {
        type: 'json',
        schema: streamingResponseSchema
      }
    });

    let fullResponse = "";
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        yield {
          type: "text" as const,
          content,
        };
      }
    }

    // Save assistant message
    await db.message.create({
      data: {
        sessionId: input.sessionId,
        role: "assistant",
        content: fullResponse,
      },
    });

    yield {
      type: "complete" as const,
      content: fullResponse,
    };
  });
