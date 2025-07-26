import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";

// Import all procedures
import { createChatSession } from "~/server/trpc/procedures/createChatSession";
import { sendChatMessage } from "~/server/trpc/procedures/sendChatMessage";
import { completeChatSession } from "~/server/trpc/procedures/completeChatSession";
import { submitRating } from "~/server/trpc/procedures/submitRating";
import { doctorLogin } from "~/server/trpc/procedures/doctorLogin";
import { doctorRegister } from "~/server/trpc/procedures/doctorRegister";
import { getDoctorSessions } from "~/server/trpc/procedures/getDoctorSessions";
import { getSessionDetails } from "~/server/trpc/procedures/getSessionDetails";

export const appRouter = createTRPCRouter({
  // Patient chat procedures
  createChatSession,
  sendChatMessage,
  completeChatSession,
  submitRating,
  
  // Doctor procedures
  doctorLogin,
  doctorRegister,
  getDoctorSessions,
  getSessionDetails,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
