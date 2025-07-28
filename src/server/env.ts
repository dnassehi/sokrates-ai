import { z } from "zod";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string(),
  OPENAI_API_KEY: z.string(),
  ASSISTANT_ID: z.string(),
  ANAMNESIS_MODEL: z.string(),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
