export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import SearchResultView from '@/components/rechercher/search-result-view';

export default async function SearchPage() {
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SearchResultView imagesDomain={imagesDomain} showSearchBar={false} showBookmarks={true} />
    </Suspense>
  );
}
