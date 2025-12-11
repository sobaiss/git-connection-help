'use server';

import { signIn } from '@/auth';

export async function callSignIn(
  email: string,
  password: string,
  redirect: boolean = true,
  redirectTo?: string
): Promise<any> {
  return await signIn('credentials', {
    email,
    password,
    redirect,
    redirectTo: redirectTo,
  });
}
