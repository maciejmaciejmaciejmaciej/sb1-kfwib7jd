import { z } from 'zod';

export const WooCommerceSettingsSchema = z.object({
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
  storeUrl: z.string().url(),
  preferredCategory: z.string().optional(),
});

export type WooCommerceSettings = z.infer<typeof WooCommerceSettingsSchema>;

export const MakeSettingsSchema = z.object({
  webhookUrl: z.string().url(),
});

export type MakeSettings = z.infer<typeof MakeSettingsSchema>;