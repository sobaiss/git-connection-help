'use server';

import { PaginatedProperty } from '@/types/property';
import { ITEMS_PER_PAGE, PropertySortFieldEnum, SortOrderEnum } from '@/lib/config';
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
 * Get properties with optional filters, pagination, and sorting.
 *
 * @param options - An object containing filters, page, limit, sortBy, and sortOrder.
 * @returns PaginatedProperty
 */
export async function getConsoleProperties(
  options: {
    filters?: PropertyFilters;
    page?: number;
    limit?: number;
    sortBy?: PropertySortFieldEnum;
    sortOrder?: SortOrderEnum;
  } = {}
): Promise<PaginatedProperty> {
  console.log('console getProperties called with options:', options);
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
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(sortBy ? { sortBy, sortOrder } : {}),
  };

  console.log('Fetching properties with params:', queryParams);

  const response = await fetch(
    `${apiUrl()}/console/properties?` + new URLSearchParams(queryParams).toString(),
    { method: 'GET', headers: await fetchHeaderOptions() }
  );

  if (!response.ok) {
    return { properties: [], pagination: { total: 0, page, limit, pages: 0 } };
  }

  return (await response.json()) as PaginatedProperty;
}

/**
 * Update the status of a property or multiple properties by their IDs.
 *
 * @param propertyId - The ID of the properties to update.
 * @param status - The new status to set for the properties.
 * @returns An object indicating success or failure, along with a message.
 */
export async function validateProperty(propertyId: string) {
  console.log('Validating property with ID:', propertyId);
  try {
    const response = await fetch(`${apiUrl()}/console/properties/validate/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      console.log('Failed to validate property with ID:', response);
      const responseData = await response.json();
      return {
        success: false,
        message: responseData.message || 'Une erreur lors de la validation.',
      };
    }

    return {
      success: true,
      message: 'Annonce validée avec succès!',
    };
  } catch (error) {
    console.error('Error validating property status:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}

export async function softRemoveProperty(propertyId: string) {
  console.log('Soft removing property with ID:', propertyId);
  try {
    const response = await fetch(`${apiUrl()}/console/properties/soft-remove/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      console.log('Failed to soft remove property with ID:', response);
      const responseData = await response.json();
      return {
        success: false,
        message: responseData.message || 'Une erreur est survenue lors de la suppression.',
      };
    }

    return {
      success: true,
      message: 'Annonce supprimée avec succès!',
    };
  } catch (error) {
    console.error('Error soft removing property status:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}

export async function rejectProperty(propertyId: string) {
  console.log('Disabling property with ID:', propertyId);
  try {
    const response = await fetch(`${apiUrl()}/console/properties/reject/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      console.log('Failed to reject property with ID:', response);
      const responseData = await response.json();
      return {
        success: false,
        message: responseData.message || 'Erreur lors du rejet.',
      };
    }

    return {
      success: true,
      message: 'Annonce rejetée avec succès!',
    };
  } catch (error) {
    console.error('Error rejecting property status:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}

export async function disableProperty(propertyId: string) {
  console.log('Disabling property with ID:', propertyId);
  try {
    const response = await fetch(`${apiUrl()}/console/properties/disable/${propertyId}`, {
      method: 'POST',
      headers: await fetchHeaderOptions(),
    });

    if (!response.ok) {
      console.log('Failed to disable property with ID:', response);
      const responseData = await response.json();
      return {
        success: false,
        message: responseData.message || 'Erreur lors de la désactivation.',
      };
    }

    return {
      success: true,
      message: 'Annonce désactivée avec succès!',
    };
  } catch (error) {
    console.error('Error disabling property status:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}
