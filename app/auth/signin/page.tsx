export const dynamic = 'force-dynamic';

import SignInView from '@/components/auth/signin';
import { Suspense } from 'react';

export default async function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignInView />
    </Suspense>
  );
}
