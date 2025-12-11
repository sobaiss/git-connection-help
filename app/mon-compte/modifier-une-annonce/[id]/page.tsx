import ModifierUneAnnonce from '@/components/deposer-une-annonce/modifier-une-annonce';

export default async function ModifierUneAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';

  return <ModifierUneAnnonce id={id} imagesDomain={imagesDomain} />;
}
