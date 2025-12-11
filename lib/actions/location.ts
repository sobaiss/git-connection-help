'use server';

import { Location } from '@/types/location';
import { apiUrl, fetchHeaderOptions } from './common';

export async function getCities() {
  const response = await fetch(`${apiUrl()}/locations/cities`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || '',
    },
  });

  if (response.ok) {
    return (await response.json()) as Location[];
  }

  return [] as Location[];
}

export async function getLocations(): Promise<Location[]> {
  const response = await fetch(`${apiUrl()}/locations`, {
    method: 'GET',
    headers: await fetchHeaderOptions(),
  });

  if (response.ok) {
    return (await response.json()) as Location[];
  }

  return [] as Location[];
}
