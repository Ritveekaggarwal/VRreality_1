import "dotenv/config";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  TRUST_PROXY_HOPS: z.coerce.number().default(0),

  MONGO_URI: z.string().min(1, "is required"),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),

  // Only needed if the frontend calls the API from a different origin.
  FRONTEND_URL: optional,

  AI_SERVER_URL: z.string().url(),
  AI_SERVICE_TOKEN: optional,

  GOOGLE_AUTH_CLIENT_ID: optional,

  // Tavus is optional: without it, lessons fall back to the written script.
  TAVUS_API_KEY: optional,
  TAVUS_PERSONA_ID: optional,
  TAVUS_REPLICA_ID: optional,

  EMAIL_PROVIDER: z.enum(["brevo", "gmail", "console", "none"]).optional(),
  EMAIL_FROM: optional,
  EMAIL_FROM_NAME: z.string().default("VReality"),
  BREVO_API_KEY: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  GOOGLE_REFRESH_TOKEN: optional,
  GOOGLE_USER: optional,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment variables:\n${problems}`);
  process.exit(1);
}

const env = parsed.data;

export default Object.freeze({
  ...env,
  isProduction: env.NODE_ENV === "production",
  emailProvider:
    env.EMAIL_PROVIDER ?? (env.NODE_ENV === "production" ? "none" : "console"),
});
