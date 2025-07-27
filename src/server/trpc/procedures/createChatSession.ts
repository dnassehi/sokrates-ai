import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const createChatSession = baseProcedure
  .input(z.object({ clinicCode: z.string().min(1, "Clinic code is required") }))
  .mutation(async ({ input }) => {
    console.log("createChatSession called with:", input);

    // Check if there's a doctor with this clinic code
    const doctor = await db.doctor.findFirst({
      where: { clinicCode: input.clinicCode },
    });

    console.log("Found doctor:", doctor);

    if (!doctor) {
      console.log("No doctor found with clinic code:", input.clinicCode);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid clinic code. Please check your code and try again.",
      });
    }

    const session = await db.session.create({
      data: {
        clinicCode: input.clinicCode,
        status: "active",
      },
    });

    console.log("Created session:", session);

    return {
      sessionId: session.id,
    };
  });
