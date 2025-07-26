import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getDoctorSessions = baseProcedure
  .input(z.object({
    authToken: z.string(),
    status: z.enum(["all", "active", "completed"]).optional().default("all"),
    cursor: z.number().optional(),
    limit: z.number().min(1).max(50).optional().default(20),
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

    // Build where clause
    const where = {
      clinicCode: doctorData.clinicCode,
      ...(input.status !== "all" && { status: input.status }),
      ...(input.cursor && { id: { lt: input.cursor } }),
    };

    // Fetch sessions
    const sessions = await db.session.findMany({
      where,
      include: {
        messages: {
          select: { id: true },
        },
        anamnesis: true,
        rating: true,
      },
      orderBy: { id: "desc" },
      take: input.limit + 1, // Take one extra to determine if there are more
    });

    const hasNextPage = sessions.length > input.limit;
    const items = hasNextPage ? sessions.slice(0, -1) : sessions;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

    return {
      items: items.map(session => ({
        id: session.id,
        status: session.status,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
        messageCount: session.messages.length,
        hasAnamnesis: !!session.anamnesis,
        rating: session.rating ? {
          score: session.rating.score,
          comment: session.rating.comment,
        } : null,
      })),
      nextCursor,
      hasNextPage,
    };
  });
