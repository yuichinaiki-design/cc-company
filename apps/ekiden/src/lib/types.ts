import { z } from "zod";

export const raceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  starts_at: z.string().nullable(),
  created_at: z.string(),
});
export type Race = z.infer<typeof raceSchema>;

export const runnerSchema = z.object({
  race_id: z.string().uuid(),
  bib: z.number().int(),
  name: z.string().nullable(),
  team: z.string().nullable(),
});
export type Runner = z.infer<typeof runnerSchema>;

export const sightingSchema = z.object({
  id: z.number(),
  race_id: z.string().uuid(),
  bib: z.number().int(),
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().nullable(),
  observed_at: z.string(),
  device_id: z.string().uuid(),
});
export type Sighting = z.infer<typeof sightingSchema>;

export type Position = {
  lat: number;
  lng: number;
  updatedAt: number;
  sampleCount: number;
};
