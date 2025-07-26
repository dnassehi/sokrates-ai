import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const createChatSession = baseProcedure
  .input(z.object({ clinicCode: z.string().min(1, "Clinic code is required") }))
  .mutation(async ({ input }) => {
    const session = await db.session.create({
      data: {
        clinicCode: input.clinicCode,
        status: "active",
      },
    });

    return {
      sessionId: session.id,
    };
  });
