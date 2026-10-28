import { z } from "zod";

// state returned by Server Actions used with useActionState
export type FormState = { error?: string; ok?: boolean } | null;

export const siteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  baseUrl: z
    .string()
    .trim()
    .url("Enter a valid URL, e.g. https://example.com")
    .refine(
      (u) => /^https?:\/\//i.test(u),
      "Only http and https URLs are allowed",
    ),
});

export const endpointSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, "Path is required")
    .max(200, "Path is too long")
    .refine((p) => p.startsWith("/"), "Path must start with /")
    .refine((p) => !p.startsWith("//"), "Path cannot start with //")
    .refine((p) => !/\s/.test(p), "Path cannot contain spaces"),
  method: z.enum(["GET", "HEAD"], { message: "Method must be GET or HEAD" }),
  intervalMinutes: z.coerce
    .number({ message: "Interval must be a number" })
    .int("Interval must be a whole number")
    .min(1, "Minimum interval is 1 minute")
    .max(1440, "Maximum interval is 1440 minutes (24 hours)"),
  timeoutSeconds: z.coerce
    .number({ message: "Timeout must be a number" })
    .int("Timeout must be a whole number")
    .min(1, "Minimum timeout is 1 second")
    .max(30, "Maximum timeout is 30 seconds"),
  expectedStatus: z.coerce
    .number({ message: "Expected status must be a number" })
    .int("Expected status must be a whole number")
    .min(100, "Status must be between 100 and 599")
    .max(599, "Status must be between 100 and 599"),
  failureThreshold: z.coerce
    .number({ message: "Failure threshold must be a number" })
    .int("Failure threshold must be a whole number")
    .min(1, "Failure threshold must be 1 to 10")
    .max(10, "Failure threshold must be 1 to 10"),
  keyword: z
    .string()
    .trim()
    .max(100, "Keyword is too long")
    .transform((v) => (v === "" ? null : v)),
});

export const idSchema = z.string().uuid();
