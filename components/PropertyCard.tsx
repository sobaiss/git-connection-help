'use client';

import { ExternalLink, Heart } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  addToast,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
} from '@heroui/react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Property, PropertyTypeEnum, RateTypeEnum } from '@/types/property';
import { bookmarkProperty, unbookmarkProperty } from '@/lib/actions/property';
import { getUserBookmarksIds } from '@/lib/actions/user';
import {
  getBookmarksFromCache,
  saveBookmarksToCache,
  addBookmarkToCache,
  removeBookmarkFromCache,
  getFetchInProgress,
  setFetchInProgress,
} from '@/lib/utils/bookmark-cache';
import { MapPin, Eye, Building2 } from 'lucide-react';
import { propertyTypesConfig, amenitiesIconMap } from '@/lib/config';
import { formatPrice } from '@/lib/utils/pricing';
import { getPropertyImagePath } from '@/lib/utils/image-path';
import DisplayDate from './ui/DisplayDate';

interface PropertyCardProps {
  property: Property;
  imagesDomain: string;
  viewMode?: 'grid' | 'list';
}

export default function PropertyCard({
  property,
  viewMode = 'grid',
  imagesDomain,
}: PropertyCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!session) {
        setIsBookmarked(false);
        return;
      }

      const cachedBookmarks = getBookmarksFromCache();

      if (cachedBookmarks) {
        setIsBookmarked(cachedBookmarks.includes(property.id));
      } else {
        // Check if a fetch is already in progress
        let fetchPromise = getFetchInProgress();

        if (!fetchPromise) {
          // Start a new fetch and store the promise
          fetchPromise = getUserBookmarksIds()
            .then((result) => {
              if (result.success && result.properties) {
                saveBookmarksToCache(result.properties);
                return result.properties;
              }
              return [];
            })
            .finally(() => {
              // Clear the fetch in progress flag
              setFetchInProgress(null);
            });

          setFetchInProgress(fetchPromise);
        }

        // Wait for the fetch to complete (either the one we started or the existing one)
        const bookmarks = await fetchPromise;
        setIsBookmarked(bookmarks.includes(property.id));
      }
    };

    loadBookmarks();
  }, [session, property.id]);

  const handleBookmark = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    setIsBookmarking(true);

    try {
      let result;

      if (isBookmarked) {
        result = await unbookmarkProperty(property.id);
        if (result.success) {
          removeBookmarkFromCache(property.id);
          setIsBookmarked(false);
        }
      } else {
        result = await bookmarkProperty(property.id);
        if (result.success) {
          addBookmarkToCache(property.id);
          setIsBookmarked(true);
        }
      }

      if (result.success) {
        addToast({
          title: 'Succès',
          description: result.message,
          color: 'success',
          timeout: 5000,
        });

        if (pathname === '/mon-compte/mes-favoris') {
          window.dispatchEvent(
            new CustomEvent('bookmarkRemoved', { detail: { propertyId: property.id } })
          );
        }
      } else {
        addToast({
          title: 'Erreur',
          description: result.message,
          color: 'danger',
          timeout: 5000,
        });
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      addToast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        color: 'danger',
        timeout: 5000,
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push('/auth/signin');
  };

  // Get the first image or use a placeholder
  const placeholderImage = {
    url: imagesDomain + '/images/static/logo-gray-seloger-tchad.svg',
    alt: `${property.title} - Vue principale - ${property.location}`,
    id: 'placeholder',
    order: 0,
    createdAt: new Date(),
    propertyId: property.id,
  };

  let firstImage =
    property.images && property.images.length > 0 ? property.images[0] : placeholderImage;

  // Validate image URL exists
  if (!firstImage.url || firstImage.url.trim() === '') {
    firstImage = placeholderImage;
  } else if (!firstImage.url.startsWith('http') && !firstImage.url.startsWith('/')) {
    // Relative path, build full URL
    firstImage.url = getPropertyImagePath(imagesDomain, firstImage.url, property.id);
  }

  // Generate SEO-friendly alt text
  const altText =
    firstImage.alt ||
    `${property.title} - ${property.location} - ${property.transactionType === 'achat' ? 'À vendre' : 'À louer'}`;

  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden bg-white shadow-md transition-all duration-300 hover:shadow-xl">
        <div className="text-foreground flex flex-col sm:flex-row">
          <div className="relative flex-shrink-0 sm:w-80">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Link
                href={`/annonce/${property.id}`}
                className="absolute inset-0 z-10"
                aria-label={altText}
              >
                <Image
                  src={firstImage.url}
                  as={NextImage}
                  fallbackSrc={imagesDomain + '/images/static/logo-gray-seloger-tchad.svg'}
                  alt={altText}
                  title={`${property.title} - ${property.location}`}
                  width={400}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Chips overlay */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Chip
                  color={property.transactionType === 'achat' ? 'primary' : 'secondary'}
                  variant="solid"
                  size="sm"
                  className="shadow-lg"
                >
                  {property.transactionType === 'achat' ? 'À Vendre' : 'À Louer'}
                </Chip>
                {property.featured && (
                  <Chip color="primary" variant="solid" size="sm" className="shadow-lg">
                    En Vedette
                  </Chip>
                )}
                {property.agency && property.agency.id && (
                  <Chip color="warning" variant="solid" size="sm" className="shadow-lg">
                    Pro
                  </Chip>
                )}
              </div>
              {property.agency && property.agency.id && (
                <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                  <Button
                    as={Link}
                    href={`/rechercher?agencyId=${property.agency.id}`}
                    target="_blank"
                    variant="bordered"
                    radius="full"
                    color="primary"
                    size="md"
                    endContent={<ExternalLink className="h-4 w-4" />}
                    className="hover:text-primary-800 border-none bg-transparent bg-white/60 text-gray-900 hover:bg-white"
                  >
                    <Avatar
                      src={
                        property.agency.logo
                          ? property.agency.logo.startsWith('http')
                            ? property.agency.logo
                            : property.agency.logo.startsWith('/images/')
                              ? `${imagesDomain}${property.agency.logo}`
                              : `${imagesDomain}/images/agencies/${property.agency.id}/${property.agency.logo}`
                          : undefined
                      }
                      icon={!property.agency.logo ? <Building2 className="h-4 w-4" /> : undefined}
                      size="sm"
                      color="warning"
                      className="flex-shrink-0"
                    />
                    <span className="text-default-800 text-sm font-medium">
                      {property.agency.name.slice(0, 20)}
                    </span>
                  </Button>
                </div>
              )}

              {/* Bookmark button overlay */}
              <Button
                variant="light"
                size="sm"
                isIconOnly
                className="absolute top-4 right-4 z-10 rounded-full bg-white/90 shadow-lg"
                onPress={handleBookmark}
                isLoading={isBookmarking}
                isDisabled={isBookmarking}
              >
                {isBookmarked ? (
                  <Heart className="h-4 w-4 fill-current text-red-500" />
                ) : (
                  <Heart className="h-4 w-4 text-gray-600" />
                )}
              </Button>
            </div>
          </div>

          <CardBody className="flex-1 p-6">
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h1 className="mb-3 text-sm text-emerald-700">
                    <span className="capitalize">
                      {propertyTypesConfig.find((type) => type.value === property.propertyType)
                        ?.label ?? property.propertyType.toLowerCase()}
                    </span>{' '}
                    en {property.transactionType === 'achat' ? 'vente' : 'location'}
                    {property.rooms &&
                      [
                        PropertyTypeEnum.appartement,
                        PropertyTypeEnum.maison,
                        PropertyTypeEnum.villa,
                        PropertyTypeEnum.immeuble,
                        PropertyTypeEnum.bureau_commerce,
                      ].includes(property.propertyType) && (
                        <span className="font-bold">
                          &nbsp;{property.rooms} pièce{property.rooms > 1 ? 's' : ''}
                        </span>
                      )}
                    {property.rooms && <span className="font-bold">&nbsp;{property.area} m²</span>}
                  </h1>
                </div>

                <div className="flex items-center text-lg text-emerald-800">
                  <span className="font-bold">{formatPrice(property.price)}</span>
                  {property.rate && property.rate !== RateTypeEnum.unique && (
                    <span className="text-gray-500"> / {property.rate}</span>
                  )}
                </div>

                <div className="text-default-500 flex items-center text-xs">
                  <MapPin className="mr-2 h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">{property.location}</span>
                </div>

                {/* Amenities section */}
                <div className="min-h-[30px]">
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {property.amenities.slice(0, 6).map((propertyAmenity) => {
                        const amenityName = propertyAmenity.amenity?.name || '';
                        const IconComponent = amenitiesIconMap[amenityName.toLowerCase()] || MapPin;

                        return (
                          <div
                            className="text-default-700 flex items-center gap-1.5 text-xs"
                            key={propertyAmenity.id}
                          >
                            <IconComponent className="text-primary-600 h-4 w-4 flex-shrink-0" />
                            <span className="capitalize">{amenityName}</span>
                          </div>
                        );
                      })}
                      {property.amenities.length > 6 && (
                        <span className="text-default-500 text-xs">
                          +{property.amenities.length - 6} plus
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-700">
                  <DisplayDate date={property.publishedAt || ''} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Link href={`/annonce/${property.id}`}>
                  <Button
                    variant="bordered"
                    radius="full"
                    color="primary"
                    size="md"
                    className="text-primary-900 border-primary-600 hover:border-primary hover:bg-primary border bg-white font-semibold"
                  >
                    <Eye className="text-primary-600 pr-2" />
                    Voir les Détails
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Modal isOpen={showLoginModal} onOpenChange={setShowLoginModal}>
        <ModalContent>
          <ModalHeader>Connexion requise</ModalHeader>
          <ModalBody>
            <p>Vous devez être connecté pour ajouter des annonces à vos favoris.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowLoginModal(false)}>
              Annuler
            </Button>
            <Button color="primary" onPress={handleLoginRedirect}>
              Se connecter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Card className="group transform overflow-hidden bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="text-foreground relative">
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-600">
            <Link
              href={`/annonce/${property.id}`}
              className="absolute inset-0 z-10"
              aria-label={altText}
            >
              <Image
                src={firstImage.url}
                as={NextImage}
                fallbackSrc={imagesDomain + '/images/static/logo-gray-seloger-tchad.svg'}
                alt={altText}
                title={`${property.title} - ${property.location}`}
                width={400}
                height={300}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Chips overlay */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Chip
                color={property.transactionType === 'achat' ? 'primary' : 'secondary'}
                variant="solid"
                size="sm"
                className="shadow-lg"
              >
                {property.transactionType === 'achat' ? 'À Vendre' : 'À Louer'}
              </Chip>
              {property.featured && (
                <Chip color="primary" variant="solid" size="sm" className="shadow-lg">
                  En Vedette
                </Chip>
              )}
              {property.agency && property.agency.id && (
                <Chip color="warning" variant="solid" size="sm" className="shadow-lg">
                  Pro
                </Chip>
              )}
            </div>

            {property.agency && property.agency.id && (
              <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                <Button
                  as={Link}
                  href={`/rechercher?agencyId=${property.agency.id}`}
                  target="_blank"
                  variant="bordered"
                  radius="full"
                  color="primary"
                  size="md"
                  endContent={<ExternalLink className="h-4 w-4" />}
                  className="hover:text-primary-800 border-none bg-transparent bg-white/60 text-gray-900 hover:bg-white"
                >
                  <Avatar
                    src={
                      property.agency.logo
                        ? property.agency.logo.startsWith('http')
                          ? property.agency.logo
                          : property.agency.logo.startsWith('/images/')
                            ? `${imagesDomain}${property.agency.logo}`
                            : `${imagesDomain}/images/agencies/${property.agency.id}/${property.agency.logo}`
                        : undefined
                    }
                    icon={!property.agency.logo ? <Building2 className="h-4 w-4" /> : undefined}
                    size="sm"
                    color="primary"
                    className="flex-shrink-0 bg-transparent"
                  />
                  <span className="text-sm font-medium text-gray-600">
                    {property.agency.name?.slice(0, 20)}
                  </span>
                </Button>
              </div>
            )}

            {/* Bookmark button overlay */}
            <Button
              variant="light"
              size="sm"
              isIconOnly
              className="absolute top-4 right-4 z-10 rounded-full bg-white/90 shadow-lg"
              onPress={handleBookmark}
              isLoading={isBookmarking}
              isDisabled={isBookmarking}
            >
              {isBookmarked ? (
                <Heart className="h-4 w-4 fill-current text-red-500" />
              ) : (
                <Heart className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>
        </div>
        <CardBody className="flex h-full flex-col p-6 pt-2">
          <div className="flex-1 space-y-3">
            <div className="my-3">
              <h1 className="text-sm text-emerald-900">
                <span className="capitalize">
                  {propertyTypesConfig.find((type) => type.value === property.propertyType)
                    ?.label ?? property.propertyType.toLowerCase()}
                </span>{' '}
                en {property.transactionType === 'achat' ? 'vente' : 'location'}
                {property.rooms &&
                  [
                    PropertyTypeEnum.appartement,
                    PropertyTypeEnum.maison,
                    PropertyTypeEnum.villa,
                    PropertyTypeEnum.immeuble,
                    PropertyTypeEnum.bureau_commerce,
                  ].includes(property.propertyType) && (
                    <span className="font-bold">
                      &nbsp;{property.rooms} pièce{property.rooms > 1 ? 's' : ''}
                    </span>
                  )}
                {property.rooms && <span className="font-bold">&nbsp;{property.area} m²</span>}
              </h1>
            </div>
            <div className="flex items-center justify-between">
              <div className="mb-2 text-lg text-emerald-900">
                <span className="font-bold">{formatPrice(property.price)}</span>
                {property.rate && property.rate !== RateTypeEnum.unique && (
                  <span className="text-gray-500"> / {property.rate}</span>
                )}
              </div>
            </div>
            <div className="mb-4 flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-800">{property.location}</span>
            </div>

            {/* Amenities section */}
            <div className="min-h-[60px]">
              {property.amenities && property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {property.amenities.slice(0, 5).map((propertyAmenity) => {
                    const amenityName = propertyAmenity.amenity?.name || '';
                    const IconComponent = amenitiesIconMap[amenityName.toLowerCase()] || MapPin;

                    return (
                      <div
                        className="text-default-700 flex items-center gap-1.5 text-xs"
                        key={propertyAmenity.id}
                      >
                        <IconComponent className="text-primary-600 h-3.5 w-3.5 flex-shrink-0" />
                        <span className="capitalize">{amenityName}</span>
                      </div>
                    );
                  })}
                  {property.amenities.length > 5 && (
                    <span className="text-default-500 self-center text-xs">
                      +{property.amenities.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-700">
              <DisplayDate date={property.publishedAt || ''} />
            </div>
          </div>

          <Link href={`/annonce/${property.id}`} className="w-full">
            <Button
              variant="bordered"
              radius="full"
              color="primary"
              className="text-primary-900 border-primary-600 hover:border-primary hover:bg-primary-100 mt-4 w-full border bg-white font-semibold"
            >
              <Eye className="text-primary-600 pr-2" />
              Voir les Détails
            </Button>
          </Link>
        </CardBody>
      </Card>
    </>
  );
}
