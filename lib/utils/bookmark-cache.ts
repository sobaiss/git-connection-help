/**
 * Bookmark caching utility for managing user bookmarks in localStorage
 * Handles encoding/decoding and provides a centralized API
 */

const BOOKMARKS_CACHE_KEY = 'user_bookmarks';
const CACHE_EXPIRY_KEY = 'bookmarks_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// In-memory flag to prevent duplicate fetches
let fetchInProgress: Promise<string[]> | null = null;

/**
 * Encode data for localStorage storage
 */
function encodeForStorage(data: string[]): string {
  try {
    const jsonString = JSON.stringify(data);
    return encodeURIComponent(jsonString);
  } catch (error) {
    console.error('Error encoding data for storage:', error);
    throw new Error('Failed to encode data for storage');
  }
}

/**
 * Decode data from localStorage
 */
function decodeFromStorage(encodedData: string): string[] {
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
 * Get bookmarks from cache if available and valid
 */
export function getBookmarksFromCache(): string[] | null {
  try {
    if (!isCacheValid()) {
      return null;
    }

    const cachedBookmarks = localStorage.getItem(BOOKMARKS_CACHE_KEY);
    if (!cachedBookmarks) {
      return null;
    }

    const decodedBookmarks = decodeFromStorage(cachedBookmarks);

    if (!Array.isArray(decodedBookmarks)) {
      console.warn('Cached bookmarks data is not an array, clearing cache');
      clearBookmarksCache();
      return null;
    }

    return decodedBookmarks as string[];
  } catch (error) {
    console.error('Error retrieving bookmarks from cache:', error);
    clearBookmarksCache();
    return null;
  }
}

/**
 * Save bookmarks to cache with expiry
 */
export function saveBookmarksToCache(bookmarks: string[]): void {
  try {
    if (!Array.isArray(bookmarks)) {
      throw new Error('Bookmarks must be an array');
    }

    const encodedBookmarks = encodeForStorage(bookmarks);
    const expiryTime = Date.now() + CACHE_DURATION;

    localStorage.setItem(BOOKMARKS_CACHE_KEY, encodedBookmarks);
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Error saving bookmarks to cache:', error);
  }
}

/**
 * Clear bookmarks cache
 */
export function clearBookmarksCache(): void {
  try {
    localStorage.removeItem(BOOKMARKS_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing bookmarks cache:', error);
  }
}

/**
 * Add a bookmark to cache
 */
export function addBookmarkToCache(propertyId: string): void {
  try {
    const bookmarks = getBookmarksFromCache() || [];
    if (!bookmarks.includes(propertyId)) {
      bookmarks.push(propertyId);
      saveBookmarksToCache(bookmarks);
    }
  } catch (error) {
    console.error('Error adding bookmark to cache:', error);
  }
}

/**
 * Remove a bookmark from cache
 */
export function removeBookmarkFromCache(propertyId: string): void {
  try {
    const bookmarks = getBookmarksFromCache() || [];
    const filtered = bookmarks.filter((id) => id !== propertyId);
    saveBookmarksToCache(filtered);
  } catch (error) {
    console.error('Error removing bookmark from cache:', error);
  }
}

/**
 * Check if a property is bookmarked
 */
export function isPropertyBookmarked(propertyId: string): boolean {
  try {
    const bookmarks = getBookmarksFromCache() || [];
    return bookmarks.includes(propertyId);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

/**
 * Get the current fetch in progress promise
 */
export function getFetchInProgress(): Promise<string[]> | null {
  return fetchInProgress;
}

/**
 * Set the fetch in progress promise
 */
export function setFetchInProgress(promise: Promise<string[]> | null): void {
  fetchInProgress = promise;
}
