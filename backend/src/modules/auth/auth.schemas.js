import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Please enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

const otp = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().max(60).default(""),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"),
  dob: z.coerce
    .date({ error: "Please enter your date of birth" })
    .max(new Date(), "Date of birth cannot be in the future"),
  city: z.string().trim().max(80).default(""),
  classStudying: z.string().trim().max(80).default(""),
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(200),
});

export const googleSchema = z.object({
  credential: z.string().min(1, "Google credential is required").max(4096),
});

export const emailSchema = z.object({ email });
export const otpSchema = z.object({ email, otp });
export const resetSchema = z.object({ email, otp, newPassword: password });
