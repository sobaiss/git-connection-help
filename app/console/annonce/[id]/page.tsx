import PropertyDetailsView from '@/components/property/property-details';

export default async function PropertyDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';

  return (
    <div className="min-h-screen">
      <PropertyDetailsView propertyId={id} imagesDomain={imagesDomain} action="console_view" />
    </div>
  );
}
