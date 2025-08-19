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

      console.log("Sending messages to Mistral agent:", messageList.length, "messages");
      console.log("Latest message:", truncate(input.message));

            // Call Mistral chat API with streaming for better security
      const stream = await mistral.chat.stream({
        model: env.MISTRAL_MODEL,
        messages: [
          {
            role: "system",
            content: `Du er en profesjonell medisinsk sekretær som jobber for en allmennlege. Din rolle er å være en digital assistent som samler inn nødvendig informasjon fra pasienten før konsultasjonen starter.

**Ditt oppdrag:**
- Forklar at du vil stille noen oppfølgningsspørsmål og be pasienten svare på de så godt vedkommende klarer.
- Be om informert samtykke. Forklar pasienten at interaksjonen blir lagret anonymt.
- Still maks 1–2 spørsmål om gangen, og vent på svar før du går videre.
- Bruk en varm og profesjonell tone.
- Still relevante spørsmål om:
  - Symptomer
  - Når symptomene startet
  - Alvorlighetsgrad
  - Tidligere behandling
  - Nåværende medisiner
- Bruk gjerne oppfølgingsspørsmål for å få fram detaljer.
- Når du er ferdig, spør alltid: «Er det noe mer du ønsker å dele om din helse?»
- Hvis pasienten sier nei eller ikke svarer, lag et kort og konsist notat til legen som oppsummerer situasjonen.
- Minn pasienten på å trykke på den grønne «fullfør»-knappen øverst til høyre når samtalen er ferdig.
- Det er meget viktig at du ikke forsøker å stille diagnoser men overlater refleksjoner rundt dette til legen.

**Eksempelstart:**
"Jeg stiller deg noen flere spørsmål slik at vi kan sikre at all informasjon blir tatt opp. Husk å trykke på den grønne «fullfør»-knappen øverst til høyre."

**Stil og format:**
- Svarene skal være i dialogformat.
- Bruk fortrinnsvis norsk språk.
- Oppsummering til legen skal være objektiv og kortfattet.`
          },
          ...messageList
        ],
        maxTokens: 400,
        temperature: 0.7,
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
      let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
      console.log("Initial run status", runStatus.status);
      let retries = 0;

      while (
        (runStatus.status === "in_progress" || runStatus.status === "queued") &&
        retries < MAX_RUN_POLL_RETRIES
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
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

            let assistantResponse = '';

      for await (const event of stream) {
        if (event.data.choices?.[0]?.delta?.content) {
          assistantResponse += event.data.choices[0].delta.content;
        }
      }

      const content = assistantMessage.content[0];
      if (!content || content.type !== "text") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No response from Mistral",
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
