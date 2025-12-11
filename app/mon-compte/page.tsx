export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import MonCompteView from '@/components/mon-compte/mon-compte-view';

export default async function MonComptePage() {
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';

  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <MonCompteView imagesDomain={imagesDomain} />
    </Suspense>
  );
}
