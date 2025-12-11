import { z } from 'zod';

export const createAgencySchema = z.object({
  name: z
    .string()
    .min(2, "Le nom de l'agence est requis")
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),
  address: z.string().max(200, "L'adresse ne peut pas dépasser 200 caractères").optional(),
  location: z
    .string()
    .min(3, 'La localisation est requise')
    .max(100, 'La localisation ne peut pas dépasser 100 caractères'),
  city: z.string().max(100, 'La ville ne peut pas dépasser 100 caractères').optional(),
  zipCode: z.string().max(10, 'Le code postal ne peut pas dépasser 10 caractères').optional(),
  phone: z
    .string('Numéro téléphone invalide')
    .regex(/^[6-9]{1}[0-9]{7}$/, { error: 'Entrez un numéro de téléphone valide.' }),
  email: z.email('Adresse email invalide'),
  website: z.string().optional(),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
