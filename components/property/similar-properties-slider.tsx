'use client';

import { useEffect, useState } from 'react';
import { Property } from '@/types/property';
import { getProperties } from '@/lib/actions/property';
import PropertyCard from '@/components/PropertyCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';

interface SimilarPropertiesSliderProps {
  currentProperty: Property;
  imagesDomain: string;
}

export default function SimilarPropertiesSlider({
  currentProperty,
  imagesDomain,
}: SimilarPropertiesSliderProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchSimilarProperties = async () => {
      setIsLoading(true);
      try {
        // Fetch properties with same transaction type, property type, and location
        const result = await getProperties({
          filters: {
            transactionType: currentProperty.transactionType,
            propertyTypes: currentProperty.propertyType,
            location: currentProperty.location,
          },
          limit: 10,
        });

        // Filter out the current property
        let filtered = result.properties.filter((p) => p.id !== currentProperty.id);

        // If not enough results, fetch more with just transaction type and property type
        if (filtered.length < 4) {
          const moreResult = await getProperties({
            filters: {
              transactionType: currentProperty.transactionType,
              propertyTypes: currentProperty.propertyType,
            },
            limit: 10,
          });
          
          const moreFiltered = moreResult.properties.filter(
            (p) => p.id !== currentProperty.id && !filtered.some((f) => f.id === p.id)
          );
          
          filtered = [...filtered, ...moreFiltered].slice(0, 8);
        }

        setSimilarProperties(filtered);
      } catch (error) {
        console.error('Error fetching similar properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarProperties();
  }, [currentProperty.id, currentProperty.transactionType, currentProperty.propertyType, currentProperty.location]);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  };

  const getItemsPerView = () => {
    if (typeof window === 'undefined') return itemsPerView.desktop;
    if (window.innerWidth < 640) return itemsPerView.mobile;
    if (window.innerWidth < 1024) return itemsPerView.tablet;
    return itemsPerView.desktop;
  };

  const [visibleItems, setVisibleItems] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setVisibleItems(getItemsPerView());
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, similarProperties.length - visibleItems);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-semibold text-emerald-800">Annonces similaires</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white">
              <CardBody className="p-0">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-emerald-800">Annonces similaires</h2>
        
        {similarProperties.length > visibleItems && (
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="bordered"
              radius="full"
              size="sm"
              onPress={handlePrev}
              isDisabled={currentIndex === 0}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              isIconOnly
              variant="bordered"
              radius="full"
              size="sm"
              onPress={handleNext}
              isDisabled={currentIndex >= maxIndex}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
          }}
        >
          {similarProperties.map((property) => (
            <div
              key={property.id}
              className="w-full flex-shrink-0 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <PropertyCard property={property} imagesDomain={imagesDomain} viewMode="grid" />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator for mobile */}
      {similarProperties.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          {similarProperties.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
