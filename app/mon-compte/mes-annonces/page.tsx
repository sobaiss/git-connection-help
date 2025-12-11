export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import MyPropertiesView from '@/components/property/my-properties-view';

export default async function MyPropertiesPage() {
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';

  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <MyPropertiesView imagesDomain={imagesDomain} />
    </Suspense>
  );
}
