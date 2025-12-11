import { auth } from '@/auth';

export function apiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }
  return url;
}

export async function fetchHeaderOptions(customToken?: string) {
  const session = await auth();
  const accessToken = customToken || session?.accessToken;
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || '',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}
