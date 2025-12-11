import { getCachedLocations } from './location-cache';
import { LocationHierarchy } from '@/types/location';

export async function getLocationHierarchy(displayName: string): Promise<LocationHierarchy | null> {
  try {
    const locations = await getCachedLocations();
    const matchLocation = locations.find((loc) => loc.displayName === displayName);
    if (!matchLocation) {
      console.warn('No matching location found for:', displayName);
      return null;
    }

    const skSplit = matchLocation.sk.split('#');
    const result = skSplit.reduce(
      (acc, _curr, index) => {
        const sk = skSplit.slice(0, index + 1).join('#') + `#`;
        const location = locations.find((loc) => loc.sk === sk);

        if (location) {
          if (location.divisionLevel === 1) acc.region = location;
          if (location.divisionLevel === 2) acc.department = location;
          if (location.divisionLevel === 3) acc.city = location;
          if (location.divisionLevel === 4) acc.borough = location;
          if (location.divisionLevel === 5) acc.neighborhood = location;
        }

        return acc;
      },
      { selected: matchLocation } as LocationHierarchy
    );

    return result;
  } catch (error) {
    console.error('Error getting location hierarchy:', error);
    return null;
  }
}
