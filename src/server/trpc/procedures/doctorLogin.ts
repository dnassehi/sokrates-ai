import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const doctorLogin = baseProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Find doctor by email
    const doctor = await db.doctor.findUnique({
      where: { email: input.email },
    });

    if (!doctor) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await bcryptjs.compare(input.password, doctor.password);
    
    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        doctorId: doctor.id,
        email: doctor.email,
        clinicCode: doctor.clinicCode,
      }, 
      env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    return {
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        clinicCode: doctor.clinicCode,
      },
    };
  });
