'use server';

import { auth } from '@/auth';
import { PaginatedProperty, Property, PropertyStatusEnum } from '@/types/property';
import {
  CreatePropertyInput,
  createPropertySchema,
  sendMessageSchema,
  SendMessageInput,
  updatePropertySchema,
} from '../validations/property';
import { ITEMS_PER_PAGE, PropertySortFieldEnum, SortOrderEnum } from '../config';
import { z } from 'zod';
import { apiUrl, fetchHeaderOptions } from './common';

export interface PropertyFilters {
  location?: string;
  propertyTypes?: string;
  transactionType?: string;
  price?: string;
  area?: string;
  landArea?: string;
  rooms?: string;
  bedrooms?: string;
  ownerType?: string;
  amenities?: string;
  availableAt?: string;
  status?: string;
  agencyId?: string;
  search?: string;
}

/**
 * Create a new property.
 *
 * @param data - The data for the new property.
 * @returns The created property or an error object.
 */
export async function createProperty(data: CreatePropertyInput) {
  const validatedFields = createPropertySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  const response = await fetch(`${apiUrl()}/properties`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify(validatedFields.data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: responseData.message || "Erreur lors de la création de l'annonce.",
    };
  }

  return responseData;
}

/**
 * Update an existing property.
 *
 * @param id - The ID of the property to update.
 * @param data - The data to update the property with.
 * @returns The updated property or an error object.
 */
export async function updateProperty(id: string, data: CreatePropertyInput) {
  const validatedFields = updatePropertySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Corriger les erreurs ci-dessous.',
    };
  }

  console.log('Validated fields data:', validatedFields.data);

  const url = data.status === PropertyStatusEnum.attente_validation ? `requestValidation` : `draft`;

  const response = await fetch(`${apiUrl()}/properties/${url}/${id}`, {
    method: 'PUT',
    headers: await fetchHeaderOptions(),
    body: JSON.stringify(validatedFields.data),
  });

  const responseData = await response.json();

  console.log('Update property response data :', responseData);

  if (!response.ok) {
    return {
      errors: responseData.errors || {},
      message: responseData.message || "Erreur lors de la mise à jour de l'annonce.",
    };
  }

  return responseData;
}

/**
 * Get properties with optional filters, pagination, and sorting.
 *
 * @param options - An object containing filters, page, limit, sortBy, and sortOrder.
 * @returns PaginatedProperty
 */
export async function getProperties(
  options: {
    filters?: PropertyFilters;
    page?: number;
    limit?: number;
    sortBy?: PropertySortFieldEnum;
    sortOrder?: SortOrderEnum;
  } = {}
): Promise<PaginatedProperty> {
  console.log('getProperties called with options:', options);
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
    ...(filters.agencyId ? { agencyId: filters.agencyId } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(sortBy ? { sortBy, sortOrder } : {}),
  };

  console.log('Fetching properties with params:', queryParams);

  const response = await fetch(
    `${apiUrl()}/properties/search?` + new URLSearchParams(queryParams).toString(),
    { method: 'GET', headers: await fetchHeaderOptions() }
  );

  console.log('-------------------- Get properties response :', response);

  if (!response.ok) {
    return { properties: [], pagination: { total: 0, page, limit, pages: 0 } };
  }

  return (await response.json()) as PaginatedProperty;
}

/**
 * Get a property by its ID.
 *
 * @param id - The ID of the property.
 * @param edit - Whether to fetch the property for editing.
 * @returns Property | null
 */
export async function getPropertyById(
  id: string,
  action?: 'user_edit' | 'console_view'
): Promise<Property | null> {
  let url = `${apiUrl()}/properties/${id}`;
  if (action === 'user_edit') {
    url = `${apiUrl()}/properties/edit/${id}`;
  } else if (action === 'console_view') {
    url = `${apiUrl()}/console/properties/${id}`;
  }

  console.log('Fetching property with URL:', url);

  const response = await fetch(url, { method: 'GET', headers: await fetchHeaderOptions() });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as Property;
}

/**
 * Get featured properties with an optional limit.
 *
 * @param limit - The maximum number of featured properties to retrieve.
 * @returns PaginatedProperty | null
 */
export async function getFeaturedProperties(limit = 6): Promise<PaginatedProperty | null> {
  const response = await fetch(
    `${apiUrl()}/properties/featured?` + new URLSearchParams({ limit: String(limit) }).toString(),
    { method: 'GET', headers: await fetchHeaderOptions() }
  );

  console.log('Fetching featured properties response :', response);

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedProperty;
}

/**
 * Increment the view count of a property by its ID.
 *
 * @param id - The ID of the property.
 * @returns Response
 */
export async function incrementViewCount(id: string) {
  const response = await fetch(`${apiUrl()}/properties/increment-views/${id}`, {
    method: 'POST',
    headers: await fetchHeaderOptions(),
  });

  return response;
}

/**
 * Send a message related to a property.
 *
 * @param data - The message data including propertyId, sender's details, and message content.
 * @returns An object indicating success or failure, along with any errors and a message.
 */
export async function sendMessage(data: SendMessageInput) {
  const validatedFields = sendMessageSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Veuillez corriger les erreurs dans le formulaire.',
    };
  }

  const { propertyId, lastName, firstName, email, phone, message } = validatedFields.data;

  try {
    const response = await fetch(`${apiUrl()}/properties/contact/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
      body: JSON.stringify({ lastName, firstName, email, phone, message }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Error response from API:', responseData);
      return {
        success: false,
        errors: responseData.errors || {},
        message: "Erreur lors de l'envoi du message. Veuillez réessayer.",
      };
    }

    return {
      success: true,
      message: 'Votre message a été envoyé avec succès!',
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      message: 'Erreur de connexion. Veuillez réessayer.',
    };
  }
}

/**
 * Bookmark a property by its ID.
 *
 * @param propertyId - The ID of the property to bookmark.
 * @returns An object indicating success or failure, along with a message.
 */
export async function bookmarkProperty(propertyId: string) {
  try {
    const response = await fetch(`${apiUrl()}/properties/bookmarks/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Erreur lors de l'ajout aux favoris.",
      };
    }

    return {
      success: true,
      message: 'Propriété ajoutée aux favoris!',
    };
  } catch (error) {
    console.error('Error bookmarking property:', error);
    return {
      success: false,
      message: 'Erreur de connexion. Veuillez réessayer.',
    };
  }
}

/**
 * Unbookmark a property by its ID.
 *
 * @param propertyId - The ID of the property to unbookmark.
 * @returns An object indicating success or failure, along with a message.
 */
export async function unbookmarkProperty(propertyId: string) {
  try {
    const response = await fetch(`${apiUrl()}/properties/bookmarks/${propertyId}`, {
      method: 'DELETE',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Erreur lors de la suppression des favoris.',
      };
    }

    return {
      success: true,
      message: 'Propriété retirée des favoris!',
    };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return {
      success: false,
      message: 'Erreur de connexion. Veuillez réessayer.',
    };
  }
}

/**
 * Delete a property or multiple properties by their IDs.
 *
 * @param propertyId - The ID or array of IDs of the properties to delete.
 * @returns An object indicating success or failure, along with a message.
 */
export async function deleteProperty(propertyId: string) {
  try {
    const url = `${apiUrl()}/properties/${propertyId}`;
    console.log('Deleting property with URL:', url);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      const responseData = await response.json();
      return {
        success: false,
        message: responseData.message || "Erreur lors de la suppression de l'annonce.",
      };
    }

    return {
      success: true,
      message: "L'annonce a été supprimée avec succès!",
    };
  } catch (error) {
    console.error('Error deleting property:', error);
    return {
      success: false,
      message: 'Erreur de suppression. Veuillez réessayer.',
    };
  }
}

export async function disableProperty(
  propertyId: string,
  action: 'disable' | 'set-rented' | 'set-sold' = 'disable'
) {
  console.log('Disabling property with ID:', propertyId);
  try {
    const response = await fetch(`${apiUrl()}/properties/${action}/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      console.log(`Failed to ${action} property with ID:`, response);
      const responseData = await response.json();
      return {
        success: false,
        message: responseData.message || 'Erreur lors de la désactivation.',
      };
    }

    const verb =
      action === 'set-rented' ? 'louée' : action === 'set-sold' ? 'vendue' : 'désactivée';
    return {
      success: true,
      message: `Annonce ${verb} avec succès!`,
    };
  } catch (error) {
    console.error('Error disabling property status:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}
