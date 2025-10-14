import { ref } from "firebase/storage";
import { z } from "zod";

export const UpdateProfileInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name is too long")
      .optional(),
    avatarUrl: z
      .string()
      .url("avatarUrl must be a valid URL")
      .max(2048)
      .optional(),
    bio: z.string().trim().max(1000, "Bio is too long").optional(),
    email: z.never().optional(),
    phone: z.never().optional(),
    role: z.never().optional(),
    ovndBalance: z.never().optional(),
    points: z.never().optional(),
    externalWallet: z.never().optional(),
    internalWallet: z.never().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "No fields to update",
  });

export const ProfileFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(64, "Max 64 chars")
    .optional(),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  bio: z.string().max(240, "Max 240 chars").optional(),
  referralCode: z.string().max(100, "Max 100 chars").optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
