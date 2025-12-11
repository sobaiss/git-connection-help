'use server';

import { CreateAgencyInput, createAgencySchema } from '../validations/agency';
import { CreateUserInput, createUserSchema } from '../validations/user';
import { z } from 'zod';
import { apiUrl, fetchHeaderOptions } from './common';
import { Agency } from '@/types/agency';

export async function createAgency(data: { agency: CreateAgencyInput; user: CreateUserInput }) {
  console.log('Creating agency with data:', data);
  const validatedAgencyFields = createAgencySchema.safeParse(data.agency);
  const validatedUserFields = createUserSchema.safeParse(data.user);

  console.log('Validated agency fields:', validatedAgencyFields.error);
  console.log('Validated user fields:', validatedUserFields.error);

  if (!validatedAgencyFields.success || !validatedUserFields.success) {
    return {
      errors: {
        agency: {
          ...(validatedAgencyFields.success
            ? {}
            : (z.flattenError(validatedAgencyFields.error).fieldErrors ?? {})),
        },
        user: {
          ...(validatedUserFields.success
            ? {}
            : (z.flattenError(validatedUserFields.error).fieldErrors ?? {})),
        },
      },
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  const response = await fetch(`${apiUrl()}/agencies`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({
      agency: validatedAgencyFields.data,
      user: validatedUserFields.data,
    }),
  });

  const responseData = await response.json();
  if (!response.ok) {
    return {
      errors: responseData.errors ?? {},
      message: responseData.message ?? "Une erreur est survenue lors de la création de l'agence.",
    };
  }

  return responseData;
}

export async function getAgency(agencyId: string): Promise<Agency | null> {
  const response = await fetch(`${apiUrl()}/agencies/${agencyId}`, {
    method: 'GET',
    headers: await fetchHeaderOptions(),
  });

  if (!response.ok) {
    console.error('Error fetching agency:', response);
    throw new Error('Failed to fetch agency data');
  }

  return (await response.json()) as Agency;
}
