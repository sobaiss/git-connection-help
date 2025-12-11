export type Location = {
  pk: string; // Partition key, e.g., "commune"
  sk: string; // Sort key, e.g., "city"
  name: string; // Name of the city
  displayName: string; // Display name of the city
  zip: string; // Postal code of the city
  gmap?: string; // Google Maps link for the city
  divisionLevel: number; // Administrative division level
  divisionName: string; // Name of the administrative division
};

export type LocationHierarchy = {
  city?: Location;
  borough?: Location;
  neighborhood?: Location;
  department?: Location;
  region?: Location;
  selected?: Location;
};
