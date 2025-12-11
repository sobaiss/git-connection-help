import { UserTypeEnum } from '@/types/user';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .optional()
      .or(z.literal('')),
    lastName: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .optional()
      .or(z.literal('')),
    email: z.email('Adresse e-mail invalide'),
    phone: z.string().regex(/^[6-9]{1}[0-9]{7}$/, {
      message: 'Entrez un numéro de téléphone valide.',
    }),
    location: z.string().optional(),
    city: z.string().optional(),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
    }),
    confirmPassword: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
      message: 'Confirmez votre mot de passe.',
    }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter les conditions d'utilisation.",
    }),
    acceptMarketing: z.boolean(),
    agencyId: z.string().optional(),
    userType: z.enum(UserTypeEnum).default(UserTypeEnum.particulier),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
      });
    }
  });

export const signInSchema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean().optional(),
});

export const userSettingsSchema = z.object({
  acceptEmailContact: z.boolean().default(true),
  acceptPhoneContact: z.boolean().default(true),
  displayEmail: z.boolean().default(false),
  displayPhone: z.boolean().default(false),
});
export const updateUserSchema = createUserSchema.partial();

export const updateUserSettingsSchema = userSettingsSchema.partial();
export const savedSearchSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom de la recherche est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  filters: z.object({
    location: z.string().optional(),
    propertyTypes: z.array(z.string()).optional(),
    transactionType: z.string().optional(),
    priceRange: z.tuple([z.number(), z.number()]).optional(),
    areaRange: z.tuple([z.number(), z.number()]).optional(),
    bedrooms: z.string().optional(),
  }),
  alertsEnabled: z.boolean().default(false),
});

export const createRightSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du droit est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

export const updateRightSchema = createRightSchema.partial();

export const assignRightSchema = z.object({
  rightIds: z.array(z.string()).min(1, 'Au moins un droit doit être sélectionné'),
});

export const changeUserPasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'L’ancien mot de passe est requis'),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
    }),
    confirmPassword: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
      message: 'Confirmez votre mot de passe.',
    }),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
      });
    }
  });

export const changeEmailAccountSchema = z
  .object({
    newEmail: z.email('Le nouvel email est invalide'),
    email: z.email('Email invalide'),
  })
  .superRefine(({ email, newEmail }, ctx) => {
    if (email.toUpperCase() === newEmail.toUpperCase()) {
      ctx.addIssue({
        code: 'custom',
        message: "La nouvelle adresse e-mail doit être différente de l'adresse actuelle.",
        path: ['newEmail'],
      });
    }
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
export type CreateRightInput = z.infer<typeof createRightSchema>;
export type UpdateRightInput = z.infer<typeof updateRightSchema>;
export type AssignRightInput = z.infer<typeof assignRightSchema>;
export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;
export const LoginSchema = z.object({
  email: z.email('Adresse e-mail invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
    .max(100, 'Le mot de passe doit comporter au plus 100 caractères'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Adresse e-mail invalide'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Le token est requis'),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
    }),
    confirmPassword: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
      message: 'Confirmez votre mot de passe.',
    }),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
      });
    }
  });

export type ChangeEmailAccountInput = z.infer<typeof changeEmailAccountSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
