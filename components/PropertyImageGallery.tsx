'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { Button, Modal, ModalContent, ModalBody } from '@heroui/react';
import Image from 'next/image';
import { Property, PropertyImage } from '@/types/property';
import { CURRENCY } from '@/lib/config';

interface PropertyImageGalleryProps {
  property: Property;
  images: PropertyImage[];
  className?: string;
}

export default function PropertyImageGallery({
  property,
  images,
  className = '',
}: PropertyImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Ensure we have images to display
  const propertyImages =
    images && images.length > 0
      ? images
      : [
          {
            id: 'placeholder',
            url: '/logo-gray-seloger-tchad.svg', //logo-seloger-tchad.svg
            alt: `${property.title} - Vue principale`,
            order: 0,
            createdAt: new Date(),
            propertyId: property.id,
          },
        ];

  const currentImage = propertyImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? propertyImages.length - 1 : prev - 1));
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Generate SEO-friendly alt text
  const generateAltText = (image: PropertyImage, index: number) => {
    const imageTypes = [
      'vue-principale',
      'salon',
      'cuisine',
      'chambre',
      'salle-de-bain',
      'exterieur',
    ];
    const imageType = imageTypes[index] || 'vue-interieure';

    return image.alt || `${property.title} - ${imageType} - ${property.location}`;
  };

  // Generate structured data for the main image
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: propertyImages[0]?.url,
    description: `${property.title} - ${property.location}`,
    name: property.title,
    caption: `${property.propertyType} à ${property.location} - ${property.price}${CURRENCY}`,
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={`relative ${className}`}>
        {/* Main Image */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
          <Image
            src={currentImage.url}
            alt={generateAltText(currentImage, currentImageIndex)}
            title={`${property.title} - Image ${currentImageIndex + 1} sur ${propertyImages.length}`}
            width={800}
            height={500}
            priority
            className="cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={openLightbox}
          />

          {/* Navigation Arrows */}
          {propertyImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onPress={prevImage}
                className="absolute top-1/2 left-4 h-12 min-w-12 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                isIconOnly
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={nextImage}
                className="absolute top-1/2 right-4 h-12 min-w-12 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                isIconOnly
                aria-label="Image suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="sm"
            onPress={openLightbox}
            className="absolute right-4 bottom-4 h-12 min-w-12 rounded-full bg-white/90 hover:bg-white"
            isIconOnly
            aria-label="Voir en plein écran"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Image Counter */}
          {propertyImages.length > 1 && (
            <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
              {currentImageIndex + 1} / {propertyImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {propertyImages.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {propertyImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all hover:scale-105 ${
                  index === currentImageIndex
                    ? 'border-primary ring-primary/20 ring-2'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`Voir l'image ${index + 1}`}
              >
                <Image
                  src={image.url}
                  alt={generateAltText(image, index)}
                  width={80}
                  height={64}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Modal
        isOpen={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        size="full"
        classNames={{
          base: 'bg-black/95',
          backdrop: 'bg-black/80',
          closeButton: 'hidden',
        }}
      >
        <ModalContent className="bg-transparent shadow-none">
          <ModalBody className="p-0">
            <div className="relative flex h-full w-full items-center justify-center">
              {/* Close Button */}
              <Button
                variant="light"
                size="lg"
                onPress={closeLightbox}
                className="absolute top-4 right-4 z-10 h-12 min-w-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                isIconOnly
                aria-label="Fermer"
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Main Lightbox Image */}
              <div className="relative h-full max-h-[90vh] w-full max-w-6xl">
                <Image
                  src={currentImage.url}
                  alt={generateAltText(currentImage, currentImageIndex)}
                  title={`${property.title} - Vue agrandie`}
                  width={1200}
                  height={800}
                  className="object-contain"
                />
              </div>

              {/* Lightbox Navigation */}
              {propertyImages.length > 1 && (
                <>
                  <Button
                    variant="light"
                    size="lg"
                    onPress={prevImage}
                    className="absolute top-1/2 left-4 h-16 min-w-16 -translate-y-1/2 rounded-full bg-white/20 text-white hover:bg-white/30"
                    isIconOnly
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="light"
                    size="lg"
                    onPress={nextImage}
                    className="absolute top-1/2 right-4 h-16 min-w-16 -translate-y-1/2 rounded-full bg-white/20 text-white hover:bg-white/30"
                    isIconOnly
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Lightbox Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-white">
                {currentImageIndex + 1} / {propertyImages.length}
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
