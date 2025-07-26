import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getSessionDetails = baseProcedure
  .input(z.object({
    authToken: z.string(),
    sessionId: z.number(),
  }))
  .query(async ({ input }) => {
    // Verify JWT token
    let doctorData;
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      doctorData = z.object({ 
        doctorId: z.number(),
        clinicCode: z.string(),
      }).parse(verified);
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Fetch session with all related data
    const session = await db.session.findUnique({
      where: { id: input.sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        anamnesis: true,
        rating: true,
      },
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session not found",
      });
    }

    // Verify session belongs to doctor's clinic
    if (session.clinicCode !== doctorData.clinicCode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to this session",
      });
    }

    return {
      id: session.id,
      status: session.status,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      messages: session.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      anamnesis: session.anamnesis,
      rating: session.rating,
    };
  });
