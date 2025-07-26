import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const submitRating = baseProcedure
  .input(z.object({
    sessionId: z.number(),
    score: z.number().min(1).max(5),
    comment: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    // Verify session exists and is completed
    const session = await db.session.findUnique({
      where: { id: input.sessionId },
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session not found",
      });
    }

    if (session.status !== "completed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Session must be completed before rating",
      });
    }

    // Check if rating already exists
    const existingRating = await db.rating.findUnique({
      where: { sessionId: input.sessionId },
    });

    if (existingRating) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Rating already submitted for this session",
      });
    }

    // Create rating
    const rating = await db.rating.create({
      data: {
        sessionId: input.sessionId,
        score: input.score,
        comment: input.comment,
      },
    });

    return {
      success: true,
      ratingId: rating.id,
    };
  });
