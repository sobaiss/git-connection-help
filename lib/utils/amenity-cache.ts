/**
 * Amenity caching utility for managing amenities in localStorage
 * Handles UTF-8 encoding/decoding and provides a centralized API
 */

import { Amenity } from '@/types/property';
import { getAmenities } from '@/lib/actions/amenity';

const AMENITIES_CACHE_KEY = 'amenities';
const CACHE_EXPIRY_KEY = 'amenities_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Encode data for localStorage storage with UTF-8 support
 */
function encodeForStorage(data: Amenity[]): string {
  try {
    const jsonString = JSON.stringify(data);
    return encodeURIComponent(jsonString);
  } catch (error) {
    console.error('Error encoding data for storage:', error);
    throw new Error('Failed to encode data for storage');
  }
}

/**
 * Decode data from localStorage with UTF-8 support
 */
function decodeFromStorage(encodedData: string): Amenity[] {
  try {
    const decodedString = decodeURIComponent(encodedData);
    return JSON.parse(decodedString);
  } catch (error) {
    console.error('Error decoding data from storage:', error);
    throw new Error('Failed to decode data from storage');
  }
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(): boolean {
  try {
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiryTime) return false;

    const expiry = parseInt(expiryTime, 10);
    return Date.now() < expiry;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Get amenities from cache if available and valid
 */
function getAmenitiesFromCache(): Amenity[] | null {
  try {
    if (!isCacheValid()) {
      return null;
    }

    const cachedAmenities = localStorage.getItem(AMENITIES_CACHE_KEY);
    if (!cachedAmenities) {
      return null;
    }

    const decodedAmenities = decodeFromStorage(cachedAmenities);

    // Validate that the decoded data is an array
    if (!Array.isArray(decodedAmenities)) {
      console.warn('Cached amenities data is not an array, clearing cache');
      clearAmenitiesCache();
      return null;
    }

    return decodedAmenities as Amenity[];
  } catch (error) {
    console.error('Error retrieving amenities from cache:', error);
    // Clear corrupted cache
    clearAmenitiesCache();
    return null;
  }
}

/**
 * Save amenities to cache with expiry
 */
function saveAmenitiesToCache(amenities: Amenity[]): void {
  try {
    if (!Array.isArray(amenities)) {
      throw new Error('Amenities must be an array');
    }

    const encodedAmenities = encodeForStorage(amenities);
    const expiryTime = Date.now() + CACHE_DURATION;

    localStorage.setItem(AMENITIES_CACHE_KEY, encodedAmenities);
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Error saving amenities to cache:', error);
    // Don't throw here to avoid breaking the app if localStorage fails
  }
}

/**
 * Clear amenities cache
 */
function clearAmenitiesCache(): void {
  try {
    localStorage.removeItem(AMENITIES_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing amenities cache:', error);
  }
}

/**
 * Fetch amenities from server and update cache
 */
async function fetchAndCacheAmenities(): Promise<Amenity[]> {
  try {
    const amenities = await getAmenities();
    if (amenities && Array.isArray(amenities)) {
      saveAmenitiesToCache(amenities);
      return amenities;
    }
    throw new Error('Invalid amenities data received from server');
  } catch (error) {
    console.error('Error fetching amenities from server:', error);
    throw error;
  }
}

/**
 * Main function to get amenities with caching
 * Returns cached data if available and valid, otherwise fetches from server
 */
export async function getCachedAmenities(): Promise<Amenity[]> {
  try {
    // First, try to get from cache
    const cachedAmenities = getAmenitiesFromCache();
    if (cachedAmenities) {
      return cachedAmenities;
    }

    // If no valid cache, fetch from server
    return await fetchAndCacheAmenities();
  } catch (error) {
    console.error('Error getting cached amenities:', error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Force refresh amenities from server
 */
export async function refreshAmenities(): Promise<Amenity[]> {
  try {
    clearAmenitiesCache();
    return await fetchAndCacheAmenities();
  } catch (error) {
    console.error('Error refreshing amenities:', error);
    // Try to return cached data as fallback
    const cachedAmenities = getAmenitiesFromCache();
    return cachedAmenities || [];
  }
}

/**
 * Check if amenities are cached and valid
 */
export function hasValidAmenityCache(): boolean {
  return getAmenitiesFromCache() !== null;
}

/**
 * Get cache status information
 */
export function getCacheStatus(): {
  hasCachedData: boolean;
  isValid: boolean;
  expiryTime: Date | null;
  itemCount: number;
} {
  try {
    const cachedAmenities = getAmenitiesFromCache();
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);

    return {
      hasCachedData: !!localStorage.getItem(AMENITIES_CACHE_KEY),
      isValid: isCacheValid(),
      expiryTime: expiryTime ? new Date(parseInt(expiryTime, 10)) : null,
      itemCount: cachedAmenities ? cachedAmenities.length : 0,
    };
  } catch (error) {
    console.error('Error getting cache status:', error);
    return {
      hasCachedData: false,
      isValid: false,
      expiryTime: null,
      itemCount: 0,
    };
  }
}
