/**
 * Location caching utility for managing locations in localStorage
 * Handles UTF-8 encoding/decoding and provides a centralized API
 */

import { Location } from '@/types/location';
import { getLocations } from '@/lib/actions/location';

const LOCATIONS_CACHE_KEY = 'locations';
const CACHE_EXPIRY_KEY = 'locations_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Encode data for localStorage storage with UTF-8 support
 */
function encodeForStorage(data: Location[]): string {
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
function decodeFromStorage(encodedData: string): Location[] {
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
 * Get locations from cache if available and valid
 */
function getLocationsFromCache(): Location[] | null {
  try {
    if (!isCacheValid()) {
      return null;
    }

    const cachedLocations = localStorage.getItem(LOCATIONS_CACHE_KEY);
    if (!cachedLocations) {
      return null;
    }

    const decodedLocations = decodeFromStorage(cachedLocations);

    // Validate that the decoded data is an array
    if (!Array.isArray(decodedLocations) || decodedLocations.length === 0) {
      console.warn('Cached locations data is not a valid array, clearing cache');
      clearLocationsCache();
      return null;
    }

    return decodedLocations as Location[];
  } catch (error) {
    console.error('Error retrieving locations from cache:', error);
    // Clear corrupted cache
    clearLocationsCache();
    return null;
  }
}

/**
 * Save locations to cache with expiry
 */
function saveLocationsToCache(locations: Location[]): void {
  try {
    if (!Array.isArray(locations)) {
      throw new Error('Locations must be an array');
    }

    const encodedLocations = encodeForStorage(locations);
    const expiryTime = Date.now() + CACHE_DURATION;

    localStorage.setItem(LOCATIONS_CACHE_KEY, encodedLocations);
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Error saving locations to cache:', error);
    // Don't throw here to avoid breaking the app if localStorage fails
  }
}

/**
 * Clear locations cache
 */
function clearLocationsCache(): void {
  try {
    localStorage.removeItem(LOCATIONS_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing locations cache:', error);
  }
}

/**
 * Fetch locations from server and update cache
 */
async function fetchAndCacheLocations(): Promise<Location[]> {
  try {
    const locations = await getLocations();
    if (locations && Array.isArray(locations) && locations.length > 0) {
      saveLocationsToCache(locations);
      return locations;
    }
    throw new Error('Invalid locations data received from server');
  } catch (error) {
    console.error('Error fetching locations from server:', error);
    throw error;
  }
}

/**
 * Main function to get locations with caching
 * Returns cached data if available and valid, otherwise fetches from server
 */
export async function getCachedLocations(): Promise<Location[]> {
  try {
    // First, try to get from cache
    const cachedLocations = getLocationsFromCache();
    if (cachedLocations) {
      return cachedLocations;
    }

    // If no valid cache, fetch from server
    return await fetchAndCacheLocations();
  } catch (error) {
    console.error('Error getting cached locations:', error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Force refresh locations from server
 */
export async function refreshLocations(): Promise<Location[]> {
  try {
    clearLocationsCache();
    return await fetchAndCacheLocations();
  } catch (error) {
    console.error('Error refreshing locations:', error);
    // Try to return cached data as fallback
    const cachedLocations = getLocationsFromCache();
    return cachedLocations || [];
  }
}

/**
 * Check if locations are cached and valid
 */
export function hasValidLocationCache(): boolean {
  return getLocationsFromCache() !== null;
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
    const cachedLocations = getLocationsFromCache();
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);

    return {
      hasCachedData: !!localStorage.getItem(LOCATIONS_CACHE_KEY),
      isValid: isCacheValid(),
      expiryTime: expiryTime ? new Date(parseInt(expiryTime, 10)) : null,
      itemCount: cachedLocations ? cachedLocations.length : 0,
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
