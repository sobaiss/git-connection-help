'use server';

import { Amenity } from '@/types/property';
import { apiUrl, fetchHeaderOptions } from './common';

export async function getAmenities(): Promise<Amenity[]> {
  const response = await fetch(`${apiUrl()}/amenities`, {
    method: 'GET',
    headers: await fetchHeaderOptions(),
  });

  if (response.ok) {
    return (await response.json()) as Amenity[];
  }

  return [] as Amenity[];
}
