import { z } from "zod";

// Mirrors the backend's rules (kanaku-pillai-backend src/schemas/auth.schema.js) so users see errors before submitting.
const email = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .pipe(z.email("Enter a valid email address").max(254));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
  keepSignedIn: z.boolean().default(true),
});

const newPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .regex(/\d/, "Include a number")
  .regex(/[^A-Za-z0-9\s]/, "Include a symbol");

const passwordsMatch = (values) => values.password === values.confirmPassword;
const mismatch = { path: ["confirmPassword"], message: "Passwords don't match" };

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine(passwordsMatch, mismatch);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine(passwordsMatch, mismatch)
  .refine((values) => values.password !== values.currentPassword, {
    path: ["password"],
    message: "Choose a password different from your current one",
  });

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(80),
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptTerms: z.literal(true, { error: "Accept the Terms and Privacy Policy to continue" }),
  })
  .refine(passwordsMatch, mismatch);
