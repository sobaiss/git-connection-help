export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import VerifierEmailView from '@/components/mon-compte/verifier-email/verifier-email-view';

export default async function VerifierEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifierEmailView action="verifier-changement-email" />
    </Suspense>
  );
}
