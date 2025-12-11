'use server';

import {
  ChangeEmailAccountInput,
  changeEmailAccountSchema,
  ChangeUserPasswordInput,
  changeUserPasswordSchema,
  CreateUserInput,
  createUserSchema,
  UpdateUserInput,
  updateUserSchema,
  UpdateUserSettingsInput,
  ForgotPasswordInput,
  forgotPasswordSchema,
  ResetPasswordInput,
  resetPasswordSchema,
} from '../validations/user';
import { z } from 'zod';
import { User } from 'next-auth';
import { ITEMS_PER_PAGE, PropertySortFieldEnum, SortOrderEnum } from '../config';
import { PaginatedProperty } from '@/types/property';
import { apiUrl, fetchHeaderOptions } from './common';
import { th } from 'zod/v4/locales';

export interface UserPropertyFilters {
  location?: string;
  propertyTypes?: string;
  transactionType?: string;
  price?: string;
  area?: string;
  landArea?: string;
  rooms?: string;
  bedrooms?: string;
  amenities?: string;
  availableAt?: string;
  status?: string;
  search?: string;
}

export interface UserBookmarkFilters {
  location?: string;
  propertyTypes?: string;
  transactionType?: string;
  price?: string;
  area?: string;
  landArea?: string;
  rooms?: string;
  bedrooms?: string;
  amenities?: string;
  availableAt?: string;
  ownerType?: string;
  search?: string;
}

export async function logout() {
  const headers = await fetchHeaderOptions();
  try {
    await fetch(`${apiUrl()}/auth/logout`, {
      method: 'POST',
      headers,
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

export async function login(email: string, password: string) {
  return await fetch(`${apiUrl()}/auth/login`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ username: email, password }),
  });
}

export async function getUserProfile(accessToken?: string): Promise<User | null> {
  const response = await fetch(`${apiUrl()}/users/profile`, {
    method: 'GET',
    headers: await fetchHeaderOptions(accessToken),
  });

  if (!response.ok) {
    console.error('Erreur lors de la récupération du profil utilisateur:', await response.json());
    return null;
  }

  return (await response.json()) as User;
}

export async function createUser(data: CreateUserInput) {
  console.log('Creating user with data:', data);
  const validatedFields = createUserSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  const response = await fetch(`${apiUrl()}/users`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify(validatedFields.data),
  });

  console.log('Create user response:', response);
  const responseData = await response.json();

  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: responseData.message || "Erreur lors de la création de l'utilisateur.",
    };
  }

  return responseData;
}

export async function updateUserImage(id: string, image: string) {
  const response = await fetch(`${apiUrl()}/users/image/${id}`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ image }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour de l'image");
  }

  return (await response.json()) as User;
}

export async function deleteUserImage(id: string) {
  const response = await fetch(`${apiUrl()}/users/image/${id}`, {
    method: 'DELETE',
    headers: await fetchHeaderOptions(),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression de l'image");
  }

  return (await response.json()) as User;
}

export async function updateUserInfos(id: string, data: UpdateUserInput) {
  const validatedFields = updateUserSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  const response = await fetch(`${apiUrl()}/users/${id}`, {
    method: 'PATCH',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify(validatedFields.data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: 'Erreur lors de la mise à jour des informations utilisateur.',
    };
  }

  return responseData;
}

export async function updateUserSettings(id: string, data: UpdateUserSettingsInput) {
  const response = await fetch(`${apiUrl()}/users/settings/${id}`, {
    method: 'PATCH',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: 'Erreur lors de la mise à jour des préférences de confidentialité.',
    };
  }

  return responseData as User;
}

export async function deleteUser(id: string, reason?: string) {
  const response = await fetch(`${apiUrl()}/users/${id}`, {
    method: 'DELETE',
    headers: await fetchHeaderOptions(),
    body: reason ? JSON.stringify({ reason }) : undefined,
  });

  if (!response.ok) {
    const responseData = await response.json();
    console.error('Delete user error response:', responseData);

    return {
      errors: responseData.errors || {},
      message: responseData.message || 'Erreur lors de la suppression du compte.',
    };
  }

  return {};
}

export async function cancelDeleteAccountRequest(id: string) {
  const response = await fetch(`${apiUrl()}/users/cancel-delete-request/${id}`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
  });

  if (!response.ok) {
    const responseData = await response.json();

    return {
      errors: responseData.errors || {},
      message: responseData.message || "Erreur lors de l'annulation de la demande de suppression.",
    };
  }

  return {};
}

export async function changeAccountRequest(id: string, data: ChangeEmailAccountInput) {
  const validatedFields = changeEmailAccountSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  const response = await fetch(`${apiUrl()}/users/change-account-request/${id}`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ newEmail: data.newEmail }),
  });

  const responseData = await response.json();
  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message:
        responseData.message || "Erreur lors de la création de la demande de changement d'email.",
    };
  }

  return responseData;
}

export async function verifyEmail(token: string) {
  if (token.trim() === '') {
    throw new Error('Token de vérification invalide');
  }

  console.log('--------- Verifying email with token:', token);

  const response = await fetch(`${apiUrl()}/users/verify-email`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ token }),
  });

  const responseData = await response.json();
  console.log('Verify email response data:', responseData);
  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: "Erreur lors de la création de la demande de changement d'email.",
    };
  }

  return responseData;
}

export async function verifyEmailChange(token: string) {
  if (token.trim() === '') {
    throw new Error('Token de vérification invalide');
  }

  console.log('--------- Verifying email change with token:', token);

  const response = await fetch(`${apiUrl()}/users/verify-email-change`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ token }),
  });

  const responseData = await response.json();
  console.log('Verify email change response data:', responseData);
  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: "Erreur lors de la création de la demande de changement d'email.",
    };
  }

  return responseData;
}

export async function changePassword(id: string, data: ChangeUserPasswordInput) {
  const validatedFields = changeUserPasswordSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  const response = await fetch(`${apiUrl()}/users/change-password/${id}`, {
    method: 'PATCH',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ password: data.password, oldPassword: data.oldPassword }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error('Change password error response:', responseData);
    return {
      errors: responseData.errors || {},
      message: 'Erreur lors de la création de la demande de changement de mot de passe.',
    };
  }

  return responseData;
}

/**
 * Get IDs of bookmarked properties of the authenticated user.
 *
 * @returns An object indicating success and an array of property IDs.
 */
export async function getUserBookmarksIds() {
  try {
    const response = await getUserBookmarks({ limit: 100 });

    return {
      success: true,
      properties: response.properties.map((property) => property.id),
    };
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return {
      success: false,
      properties: [],
    };
  }
}

/** * Send a verification SMS to the user's phone number.
 *
 * @param id - The ID of the user.
 */
export async function sendVerificationEmail(id: string) {
  const response = await fetch(`${apiUrl()}/users/send-verify-email/${id}`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'envoi de l'email de vérification");
  }
}

/** * Send a verification phone SMS to the user.
 *
 * @param id - The ID of the user.
 */
export async function sendVerificationPhone(id: string) {
  const response = await fetch(`${apiUrl()}/users/send-verify-phone/${id}`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'envoi du SMS de vérification");
  }
}

/**
 * Initiate the forgot password process for a user.
 *
 * @param data - An object containing the user's email.
 * @returns An object indicating success or containing error details.
 */
export async function forgotPassword(data: ForgotPasswordInput) {
  console.log('Forgot password request:', data);
  const validatedFields = forgotPasswordSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Adresse e-mail invalide.',
    };
  }

  const response = await fetch(`${apiUrl()}/users/forgot-password`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({ email: data.email }),
  });

  if (!response.ok) {
    const responseData = await response.json();
    console.log('Forgot password response:', responseData);

    return {
      errors: responseData.errors || {},
      message: responseData.message || "Erreur lors de l'envoi de l'email de réinitialisation.",
    };
  }

  return { success: true };
}

/**
 * Reset user password using the provided token and new password.
 *
 * @param data - An object containing the reset token and the new password.
 * @returns An object indicating success or containing error details.
 */
export async function resetPassword(data: ResetPasswordInput) {
  const validatedFields = resetPasswordSchema.safeParse(data);

  if (!validatedFields.success) {
    console.log('Reset password Client validation errors:', validatedFields.error);
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Données invalides.',
    };
  }

  const response = await fetch(`${apiUrl()}/users/reset-password`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify({
      token: data.token,
      password: data.password,
    }),
  });

  if (!response.ok) {
    const responseData = await response.json();

    return {
      errors: responseData.errors || {},
      message: responseData.message || 'Erreur lors de la réinitialisation du mot de passe.',
    };
  }

  return { success: true };
}

/**
 * Get bookmarked properties of the authenticated user with optional filters, pagination, and sorting.
 *
 * @param options - An object containing filters, page, limit, sortBy, and sortOrder.
 * @returns
 */
export async function getUserBookmarks(
  options: {
    filters?: UserBookmarkFilters;
    page?: number;
    limit?: number;
    sortBy?: PropertySortFieldEnum;
    sortOrder?: SortOrderEnum;
  } = {}
): Promise<PaginatedProperty> {
  const { filters = {}, page = 1, limit = ITEMS_PER_PAGE, sortBy, sortOrder } = options;

  const queryParams: Record<string, string> = {
    page: `${page}`,
    limit: `${limit}`,
    ...(filters.location ? { location: filters.location } : {}),
    ...(filters.propertyTypes ? { propertyTypes: filters.propertyTypes } : {}),
    ...(filters.transactionType ? { transactionType: filters.transactionType } : {}),
    ...(filters.bedrooms !== undefined ? { bedrooms: String(filters.bedrooms) } : {}),
    ...(filters.price ? { price: filters.price } : {}),
    ...(filters.area ? { area: filters.area } : {}),
    ...(filters.landArea ? { landArea: filters.landArea } : {}),
    ...(filters.rooms ? { rooms: filters.rooms } : {}),
    ...(filters.bedrooms ? { bedrooms: filters.bedrooms } : {}),
    ...(filters.ownerType ? { ownerType: filters.ownerType } : {}),
    ...(filters.amenities ? { amenities: filters.amenities } : {}),
    ...(filters.availableAt ? { availableAt: filters.availableAt } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(sortBy ? { sortBy, sortOrder } : {}),
  };

  console.log('Fetching my bookmarks with params:', queryParams);

  const response = await fetch(
    `${apiUrl()}/users/bookmarks?` + new URLSearchParams(queryParams).toString(),
    { method: 'GET', headers: await fetchHeaderOptions() }
  );

  if (!response.ok) {
    console.error('Failed to fetch my bookmarks:', response);
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    return { properties: [], pagination: { total: 0, page, limit: 12, pages: 0 } };
  }

  return (await response.json()) as PaginatedProperty;
}

/** * Get properties of the authenticated user with optional filters, pagination, and sorting.
 *
 * @param filters - Filters to apply to the property search.
 * @param page - The page number for pagination.
 * @param limit - The number of items per page.
 * @param sortBy - The field to sort by.
 * @param sortOrder - The order of sorting (ascending or descending).
 * @returns
 */
export async function getUserProperties(
  options: {
    filters?: UserPropertyFilters;
    page?: number;
    limit?: number;
    sortBy?: PropertySortFieldEnum;
    sortOrder?: SortOrderEnum;
  } = {}
): Promise<PaginatedProperty> {
  const { filters = {}, page = 1, limit = ITEMS_PER_PAGE, sortBy, sortOrder } = options;

  const queryParams: Record<string, string> = {
    page: `${page}`,
    limit: `${limit}`,
    ...(filters.location ? { location: filters.location } : {}),
    ...(filters.propertyTypes ? { propertyTypes: filters.propertyTypes } : {}),
    ...(filters.transactionType ? { transactionType: filters.transactionType } : {}),
    ...(filters.bedrooms !== undefined ? { bedrooms: String(filters.bedrooms) } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.price ? { price: filters.price } : {}),
    ...(filters.area ? { area: filters.area } : {}),
    ...(filters.landArea ? { landArea: filters.landArea } : {}),
    ...(filters.rooms ? { rooms: filters.rooms } : {}),
    ...(filters.bedrooms ? { bedrooms: filters.bedrooms } : {}),
    ...(filters.amenities ? { amenities: filters.amenities } : {}),
    ...(filters.availableAt ? { availableAt: filters.availableAt } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(sortBy ? { sortBy, sortOrder } : {}),
  };

  console.log('Fetching my properties with params:', queryParams);

  const response = await fetch(
    `${apiUrl()}/users/properties?` + new URLSearchParams(queryParams).toString(),
    { method: 'GET', headers: await fetchHeaderOptions() }
  );

  console.log('Get user properties response:', response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    return { properties: [], pagination: { total: 0, page, limit, pages: 0 } };
  }

  return (await response.json()) as PaginatedProperty;
}

export async function getUser(id: string): Promise<User | null> {
  const response = await fetch(`${apiUrl()}/users/${id}`, {
    method: 'GET',
    headers: await fetchHeaderOptions(),
  });

  if (!response.ok) {
    console.error('Error fetching user:', response);
    throw new Error('Failed to fetch user data');
  }

  return (await response.json()) as User;
}
