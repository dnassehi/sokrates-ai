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
      response = await openai.chat.completions.create({
        model: env.ANAMNESIS_MODEL,
        user: `session-${input.sessionId}`,
      messages: [
        {
          role: "system",
          content: "Du er en medisinsk assistent som ekstraherer og strukturerer medisinsk informasjon fra samtaler. Returner alltid svaret som et gyldig JSON-objekt."
        },
        {
          role: "user",
          content: `Basert på følgende samtale mellom Sokrates AI-assistent og en pasient, ekstrahér og strukturer den medisinske informasjonen i de oppgitte kategoriene. Hvis informasjon mangler i en kategori, skriv "Ikke oppgitt" eller "Ingen spesifikk informasjon gitt".\n\nSamtale:\n${conversationText}\n\nReturner svaret som et JSON-objekt med følgende struktur:\n{\n  "hovedplage": "string",\n  "tidligereSykdommer": "string",\n  "medisinering": "string",\n  "allergier": "string",\n  "familiehistorie": "string",\n  "sosialLivsstil": "string",\n  "ros": "string",\n  "pasientMaal": "string",\n  "friOppsummering": "string"\n}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'anamnesis',
          schema: anamnesisJsonSchema,
        },
      },
    });
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate anamnesis",
      });
    }
    console.log(
      "OpenAI anamnesis response:",
      truncate(response.choices[0]?.message?.content ?? "")
    );

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate anamnesis",
      });
    }

    let object;
    try {
      object = JSON.parse(responseContent);
      // Validate the parsed object against our Zod schema
      object = anamnesisSchema.parse(object);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse anamnesis response",
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
