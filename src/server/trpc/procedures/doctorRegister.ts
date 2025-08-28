import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const doctorRegister = baseProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    clinicCode: z.string().min(1),
  }))
  .mutation(async ({ input }) => {
    // Check if doctor with this email already exists
    const existingDoctorByEmail = await db.doctor.findUnique({
      where: { email: input.email },
    });

    if (existingDoctorByEmail) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "En lege med denne e-postadressen eksisterer allerede",
      });
    }

    // Check if doctor with this clinic code already exists
    const existingDoctorByClinicCode = await db.doctor.findUnique({
      where: { clinicCode: input.clinicCode },
    });

    if (existingDoctorByClinicCode) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "En lege med denne klinikkoden eksisterer allerede",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(input.password, 12);

    // Create doctor
    const doctor = await db.doctor.create({
      data: {
        email: input.email,
        password: hashedPassword,
        clinicCode: input.clinicCode,
      },
    });

    return {
      success: true,
      doctorId: doctor.id,
    };
  });
