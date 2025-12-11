'use client';

import HomeSearchBarHome from '@/components/search/home-search-bar';
// import PropertyListView from '@/components/property/property-list-view';
import { Suspense, useEffect, useState } from 'react';
import Loading from '@/components/ui/Loading';
import { getCachedLocations } from '@/lib/utils/location-cache';
import { Location } from '@/types/location';
// import { getFeaturedProperties } from '@/lib/actions/property';
import { PaginatedProperty } from '@/types/property';
// import { PropertiesListSkeleton } from '@/components/property/skeletons';
import Image from 'next/image';

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  const [featuredProperties, setFeaturedProperties] = useState<PaginatedProperty>({
    properties: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 6,
      pages: 0,
    },
  });

  useEffect(() => {
    // getFeaturedProperties(6)
    //   .then((response) => {
    //     if (response) {
    //       setFeaturedProperties(response);
    //     }
    //   })
    //   .catch((error) => {
    //     console.error('Error fetching featured properties:', error);
    //   })
    //   .finally(() => {
    //     setIsLoadingProperties(false);
    //   });

    // Load locations using the cached utility
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locations = await getCachedLocations();
      setLocations(locations);
    } catch (error) {
      console.error('Error loading locations:', error);
      setLocations([]);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Search Section */}
      <section className="relative bg-gray-900 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.pexels.com/photos/5824499/pexels-photo-5824499.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="seloger-tchad-home-background"
            className="h-full w-full object-cover"
            layout="fill"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl leading-tight font-bold md:text-5xl">
              Trouvez Votre
              <span className="block text-green-400">Bien Idéal</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-100 md:text-xl">
              Découvrez des milliers de biens immobiliers partout au Tchad
            </p>
          </div>

          {/* Search Bar */}
          <Suspense fallback={<Loading />}>
            <HomeSearchBarHome locations={locations} />
          </Suspense>
        </div>
      </section>

      {/* Featured Properties */}
      {/* {isLoadingProperties && <PropertiesListSkeleton />}
      {!isLoadingProperties && <PropertyListView featuredProperties={featuredProperties} />} */}
    </div>
  );
}
