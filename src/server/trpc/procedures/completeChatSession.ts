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

const anamnesisSchema = z.object({
  hovedplage: z.string().describe("Pasientens hovedplage eller primære bekymring"),
  tidligereSykdommer: z.string().describe("Tidligere sykdommer og medisinsk historie"),
  medisinering: z.string().describe("Nåværende og tidligere medisiner"),
  allergier: z.string().describe("Kjente allergier og reaksjoner"),
  familiehistorie: z.string().describe("Arvelige sykdommer i familien"),
  sosialLivsstil: z.string().describe("Røyking, alkohol, mosjon, etc."),
  ros: z.string().describe("Review of Systems - systematisk gjennomgang"),
  pasientMaal: z.string().describe("Hva pasienten håper å oppnå"),
  friOppsummering: z.string().describe("Andre relevante opplysninger"),
});

const anamnesisJsonSchema = {
  type: "object",
  properties: {
    hovedplage: {
      type: "string",
      description: "Pasientens hovedplage eller primære bekymring"
    },
    tidligereSykdommer: {
      type: "string",
      description: "Tidligere sykdommer og medisinsk historie"
    },
    medisinering: {
      type: "string",
      description: "Nåværende og tidligere medisiner"
    },
    allergier: {
      type: "string",
      description: "Kjente allergier og reaksjoner"
    },
    familiehistorie: {
      type: "string",
      description: "Arvelige sykdommer i familien"
    },
    sosialLivsstil: {
      type: "string",
      description: "Røyking, alkohol, mosjon, etc."
    },
    ros: {
      type: "string",
      description: "Review of Systems - systematisk gjennomgang"
    },
    pasientMaal: {
      type: "string",
      description: "Hva pasienten håper å oppnå"
    },
    friOppsummering: {
      type: "string",
      description: "Andre relevante opplysninger"
    }
  },
  required: [
    "hovedplage",
    "tidligereSykdommer",
    "medisinering",
    "allergier",
    "familiehistorie",
    "sosialLivsstil",
    "ros",
    "pasientMaal",
    "friOppsummering"
  ]
};

export const completeChatSession = baseProcedure
  .input(z.object({ sessionId: z.number() }))
  .mutation(async ({ input }) => {
    // Get session with messages
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
        message: "Session is already completed",
      });
    }

    // Generate structured anamnesis from conversation
    const conversationText = session.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n\n");
    console.log(
      "Generating anamnesis for session",
      input.sessionId,
      "conversation length",
      conversationText.length
    );

    // Generate structured anamnesis using OpenAI Chat API
    console.log(
      "Calling OpenAI with prompt:",
      truncate(conversationText)
    );
    let response;
    try {
      response = await mistral.chat.complete({
        model: env.MISTRAL_MODEL,
        messages: [
        {
          role: "user",
          content: `Basert på følgende samtale mellom Sokrates AI-assistent og en pasient, ekstrahér og strukturer den medisinske informasjonen i de oppgitte kategoriene. Hvis informasjon mangler i en kategori, skriv "Ikke oppgitt" eller "Ingen spesifikk informasjon gitt".\n\nSamtale:\n${conversationText}\n\nReturner svaret som et JSON-objekt med følgende struktur:\n{\n  "hovedplage": "string",\n  "tidligereSykdommer": "string",\n  "medisinering": "string",\n  "allergier": "string",\n  "familiehistorie": "string",\n  "sosialLivsstil": "string",\n  "ros": "string",\n  "pasientMaal": "string",\n  "friOppsummering": "string"\n}`
        }
      ],
        maxTokens: 600,
        responseFormat: { type: "json_object" },
        temperature: 0.3,
    });
    } catch (error) {
      console.error("Error calling Mistral:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate anamnesis",
      });
    }
        const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate anamnesis",
      });
    }

    // Handle both string and ContentChunk[] types
    const responseText = typeof responseContent === 'string'
      ? responseContent
      : responseContent.map(chunk => chunk.type === 'text' ? chunk.text : '').join('');

    console.log(
      "Mistral anamnesis response:",
      truncate(responseText)
    );

    let object;
    try {
      // Try to parse as JSON first
      object = JSON.parse(responseText);
    } catch (error) {
      console.log("Failed to parse as JSON, trying manual extraction...");

      // Manual parsing of the response
      const extractField = (text: string, fieldName: string): string => {
        const patterns = [
          new RegExp(`"${fieldName}":\\s*"([^"]*)"`, 'i'),
          new RegExp(`${fieldName}:\\s*"([^"]*)"`, 'i'),
          new RegExp(`${fieldName}:\\s*([^\\n,}]+)`, 'i'),
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return "Ikke oppgitt";
      };

      object = {
        hovedplage: extractField(responseText, "hovedplage"),
        tidligereSykdommer: extractField(responseText, "tidligereSykdommer"),
        medisinering: extractField(responseText, "medisinering"),
        allergier: extractField(responseText, "allergier"),
        familiehistorie: extractField(responseText, "familiehistorie"),
        sosialLivsstil: extractField(responseText, "sosialLivsstil"),
        ros: extractField(responseText, "ros"),
        pasientMaal: extractField(responseText, "pasientMaal"),
        friOppsummering: extractField(responseText, "friOppsummering"),
      };

      console.log("Manually extracted object:", object);
    }

    // Validate the parsed object against our Zod schema
    try {
      object = anamnesisSchema.parse(object);
    } catch (error) {
      console.error("Validation error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate anamnesis response",
      });
    }

    // Save anamnesis to database
    await db.anamnesis.create({
      data: {
        sessionId: input.sessionId,
        ...object,
      },
    });

    // Mark session as completed
    await db.session.update({
      where: { id: input.sessionId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      anamnesis: object,
    };
  });
