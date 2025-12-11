import PropertyDetailsView from '@/components/property/property-details';
import { PropertyDetailsSkeleton } from '@/components/property/skeletons';
import { Suspense } from 'react';

export default async function PropertyDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';

  return (
    <div className="min-h-screen">
      <Suspense key={id} fallback={<PropertyDetailsSkeleton />}>
        <PropertyDetailsView propertyId={id} imagesDomain={imagesDomain} />
      </Suspense>
    </div>
  );
}
