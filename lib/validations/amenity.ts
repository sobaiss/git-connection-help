import { z } from 'zod';

export const createAmenitySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de l'équipement est requis")
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  category: z.enum(['interieur', 'exterieur']),
});

export const updateAmenitySchema = createAmenitySchema.partial();

export type CreateAmenityInput = z.infer<typeof createAmenitySchema>;
export type UpdateAmenityInput = z.infer<typeof updateAmenitySchema>;
