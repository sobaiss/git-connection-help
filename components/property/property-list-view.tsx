import PropertyCard from '@/components/PropertyCard';
import { PaginatedProperty } from '@/types/property';
import { Button } from '@heroui/react';
import Link from 'next/link';

export default function PropertyListView({
  featuredProperties,
}: {
  featuredProperties: PaginatedProperty;
}) {
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Biens en Vedette</h2>
          <p className="text-default-600 mx-auto max-w-2xl text-xl">
            Sélection de biens immobiliers les plus attractifs actuellement disponibles
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredProperties.properties.map((property) => (
            <PropertyCard key={property.id} property={property} imagesDomain={imagesDomain} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/properties">
            <Button variant="bordered" size="lg" className="px-8">
              Voir Tous les Biens
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
