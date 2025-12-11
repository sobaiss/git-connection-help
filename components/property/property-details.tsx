'use client';

import {
  MapPin,
  Calendar,
  Phone,
  TreePine,
  Maximize2,
  Grid3x3,
  Bed,
  Bath,
  Layers,
  Building,
  Armchair,
  Heart,
  Printer,
  type LucideIcon,
  Home,
  Search,
  AlertCircle,
  Copy,
  NotepadText,
  Facebook,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import { Property, PropertyImage, PropertyTypeEnum, RateTypeEnum } from '@/types/property';
import { amenitiesConfig, amenitiesIconMap, propertyTypesConfig } from '@/lib/config';
import { useEffect, useState } from 'react';
import { getLocationHierarchy } from '@/lib/utils/location-filter';
import { LocationHierarchy } from '@/types/location';
import { bookmarkProperty, unbookmarkProperty, getPropertyById } from '@/lib/actions/property';
import { getUserBookmarksIds } from '@/lib/actions/user';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  getBookmarksFromCache,
  saveBookmarksToCache,
  addBookmarkToCache,
  removeBookmarkFromCache,
} from '@/lib/utils/bookmark-cache';
import { formatPrice } from '@/lib/utils/pricing';
import { PropertyDetailsSkeleton } from './skeletons';
import Link from 'next/link';
import { getPropertyImagePath } from '@/lib/utils/image-path';
import PropertyContactView from './property-contact';
import SimilarPropertiesSlider from './similar-properties-slider';

export default function PropertyDetailsView({
  propertyId,
  imagesDomain,
  action,
}: {
  propertyId: string;
  imagesDomain: string;
  action?: 'user_edit' | 'console_view';
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchy | null>(null);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedProperty = await getPropertyById(propertyId, action);

        if (!fetchedProperty) {
          setError('not_found');
          setIsLoading(false);
          return;
        }

        setProperty(fetchedProperty);

        // incrementViewCount(fetchedProperty.id).catch((error) => {
        //   console.error('Error tracking property view:', error);
        // });
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  useEffect(() => {
    if (!property) return;

    getLocationHierarchy(property.location).then((hierarchy) => {
      setLocationHierarchy(hierarchy);
    });
  }, [property?.id]);

  useEffect(() => {
    if (!property) return;

    // Add domain name to image URLs if missing
    const images = property.images?.map((propertyImage) => {
      const clonePropertyImage = { ...propertyImage };
      const imageUrl = propertyImage.url || '';
      if (imageUrl.startsWith('http')) {
        // Already a full URL, use as-is
      } else if (imageUrl.startsWith('/images/')) {
        // Already has full path, just prepend domain
        clonePropertyImage.url = `${imagesDomain}${imageUrl}`;
      } else {
        // Relative path, build full URL
        const id = property.currentVersion?.id || property.id; //Images are linked to the main version if exists
        clonePropertyImage.url = getPropertyImagePath(imagesDomain, imageUrl, id);
      }
      return clonePropertyImage;
    });

    setPropertyImages(images || []);
  }, [property?.id, imagesDomain]);

  useEffect(() => {
    if (!property) return;

    const loadBookmarks = async () => {
      if (!session) {
        setIsBookmarked(false);
        return;
      }

      const cachedBookmarks = getBookmarksFromCache();

      if (cachedBookmarks) {
        setIsBookmarked(cachedBookmarks.includes(property.id));
      } else {
        const result = await getUserBookmarksIds();
        if (result.success && result.properties) {
          saveBookmarksToCache(result.properties);
          setIsBookmarked(result.properties.includes(property.id));
        }
      }
    };

    loadBookmarks();
  }, [session, property?.id]);

  const getAmenityIcon = (amenityName: string): LucideIcon => {
    const normalizedName = amenityName.toLowerCase().trim();
    return amenitiesIconMap[normalizedName] || Armchair;
  };

  const handleBookmark = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    if (!property) return;

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
      } else {
        addToast({
          title: 'Erreur',
          description: result.message,
          color: 'danger',
          timeout: 5000,
        });
      }
    } catch (error) {
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
    const currentPath = window.location.pathname;
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareFacebook = () => {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const title = property?.title || 'Découvrez cette annonce';
    const text = `${title} - ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyUrl = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      addToast({
        title: 'Succès',
        description: 'URL copiée dans le presse-papiers!',
        color: 'success',
        timeout: 3000,
      });
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: "Impossible de copier l'URL.",
        color: 'danger',
        timeout: 3000,
      });
    }
  };

  const getGoogleMapUrl = (): string | null => {
    if (!locationHierarchy) return null;

    const order: (keyof LocationHierarchy)[] = [
      'selected',
      'neighborhood',
      'borough',
      'city',
      'department',
      'region',
    ];

    for (const key of order) {
      const location = locationHierarchy[key];
      if (location?.gmap) {
        return location.gmap;
      }
    }

    return null;
  };

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  if (error === 'not_found') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="overflow-hidden bg-white shadow-lg">
          <CardBody className="p-12">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h1 className="mb-4 text-3xl font-bold text-gray-900">Annonce introuvable</h1>
              <p className="mb-8 text-lg text-gray-600">
                Désolé, l'annonce que vous recherchez n&apos;existe pas ou n&apos;est plus
                disponible.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/rechercher">
                  <Button
                    color="primary"
                    size="lg"
                    radius="full"
                    className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Rechercher un bien
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="bordered" size="lg" radius="full" className="px-8">
                    <Home className="mr-2 h-5 w-5" />
                    Retour à l&apos;accueil
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="overflow-hidden bg-white shadow-lg">
          <CardBody className="p-12">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="mb-4 text-3xl font-bold text-gray-900">
                Oups ! Une erreur s&apos;est produite
              </h1>
              <p className="mb-8 text-lg text-gray-600">
                Nous n&apos;avons pas pu charger les détails de cette annonce. Cela peut être dû à
                un problème temporaire de connexion.
              </p>
              <div className="mb-8 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  💡 Essayez de rafraîchir la page ou de revenir un peu plus tard.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  color="primary"
                  size="lg"
                  radius="full"
                  className="px-8"
                  onPress={() => window.location.reload()}
                >
                  Rafraîchir la page
                </Button>
                <Link href="/">
                  <Button variant="bordered" size="lg" radius="full" className="px-8">
                    <Home className="mr-2 h-5 w-5" />
                    Retour à l&apos;accueil
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - Images and Details (2 columns) */}
        <div className="space-y-6 bg-white/80 lg:col-span-2">
          {/* Enhanced Image Gallery with Action Buttons */}
          <div className="relative">
            <PropertyImageGallery property={property} images={propertyImages} className="w-full" />
            <div className="absolute top-4 right-4 flex gap-2">
              {property.status === 'disponible' && (
                <>
                  <Button
                    isIconOnly
                    radius="full"
                    variant="solid"
                    color="default"
                    className="bg-white/90 shadow-lg transition-transform hover:scale-110 hover:bg-white"
                    onPress={handleShareFacebook}
                    title="Partager sur Facebook"
                  >
                    <Facebook className="h-5 w-5 text-gray-700" />
                  </Button>
                  <Button
                    isIconOnly
                    radius="full"
                    variant="solid"
                    color="default"
                    className="bg-white/90 shadow-lg transition-transform hover:scale-110 hover:bg-white"
                    onPress={handleShareWhatsApp}
                    title="Partager sur WhatsApp"
                  >
                    <Phone className="h-5 w-5 text-gray-700" />
                  </Button>
                </>
              )}
              <Button
                isIconOnly
                radius="full"
                variant="solid"
                color="default"
                className="bg-white/90 shadow-lg transition-transform hover:scale-110 hover:bg-white"
                onPress={handleCopyUrl}
                title="Copier le lien"
              >
                <Copy className="h-5 w-5 text-gray-700" />
              </Button>
              <Button
                isIconOnly
                radius="full"
                variant="solid"
                color="default"
                className="bg-white/90 shadow-lg transition-transform hover:scale-110 hover:bg-white"
                onPress={handlePrint}
              >
                <Printer className="h-5 w-5 text-gray-700" />
              </Button>
              <Button
                isIconOnly
                radius="full"
                variant="solid"
                color="default"
                className="bg-white/90 shadow-lg transition-transform hover:scale-110 hover:bg-white"
                onPress={handleBookmark}
                isLoading={isBookmarking}
                isDisabled={isBookmarking}
              >
                <Heart
                  className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                />
              </Button>
            </div>
          </div>

          {/* Property Header */}
          <Card className="text-foreground bg-white shadow-sm">
            <CardBody className="p-6">
              <div className="mb-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="mb-3 text-sm font-bold text-emerald-700">
                      <span className="capitalize">
                        {propertyTypesConfig.find((type) => type.value === property.propertyType)
                          ?.label ?? property.propertyType.toLowerCase()}
                      </span>{' '}
                      à {property.transactionType === 'achat' ? 'acheter' : 'louer'}
                    </h1>
                    <div className="mb-4 flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-emerald-600" />
                      <span className="text-default-800 text-sm">{property.location}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="mb-2 text-lg text-emerald-700">
                      <span className="font-bold">{formatPrice(property.price)}</span>
                      {property.rate && property.rate !== RateTypeEnum.unique && (
                        <span className="text-gray-500"> / {property.rate}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Features Bar */}
                <div className="flex flex-wrap gap-8">
                  {property.area && (
                    <div className="flex items-center">
                      <Maximize2 className="text-primary-600 mr-2 h-4 w-4" />
                      <span className="text-sm">{property.area || 0}m²</span>
                    </div>
                  )}
                  {property.landArea &&
                    [
                      PropertyTypeEnum.terrain,
                      PropertyTypeEnum.terrain_agricole,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                      PropertyTypeEnum.bureau_commerce,
                      PropertyTypeEnum.appartement,
                    ].includes(property.propertyType) && (
                      <div className="flex items-center">
                        <TreePine className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">Jardin {property.landArea} m² </span>
                      </div>
                    )}
                  {property.rooms &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                      PropertyTypeEnum.bureau_commerce,
                    ].includes(property.propertyType) && (
                      <div className="flex items-center">
                        <Grid3x3 className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {property.rooms} pièce{property.rooms > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  {property.bedrooms &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                    ].includes(property.propertyType) && (
                      <div className="flex items-center">
                        <Bed className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {property.bedrooms} chambre{property.bedrooms > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  {property.bathrooms &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                    ].includes(property.propertyType) && (
                      <div className="flex items-center">
                        <Bath className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {property.bathrooms} salle{property.bathrooms > 1 ? 's' : ''} de bain/eau
                        </span>
                      </div>
                    )}
                  {property.floor &&
                    [PropertyTypeEnum.appartement, PropertyTypeEnum.bureau_commerce].includes(
                      property.propertyType
                    ) && (
                      <div className="flex items-center">
                        <Building className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">{property.floor}e étage</span>
                      </div>
                    )}
                  {property.totalFloors &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.bureau_commerce,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                    ].includes(property.propertyType) && (
                      <div className="flex items-center">
                        <Layers className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">{property.totalFloors} étages total</span>
                      </div>
                    )}
                  {property.yearBuilt &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                      PropertyTypeEnum.bureau_commerce,
                    ].includes(property.propertyType) && (
                      <div className="flex items-center">
                        <Calendar className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          Année de construction : {property.yearBuilt}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Property Details Sections */}
          <div className="space-y-6">
            {/* Description */}
            {property.description && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <NotepadText className="h-5 w-5 text-emerald-700" />
                  <h3 className="pl-2 text-sm font-semibold text-emerald-700">Description</h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-sm leading-relaxed text-emerald-900">{property.description}</p>
                </CardBody>
              </Card>
            )}

            {/* Amenities */}
            {property.amenities &&
              property.amenities.length > 0 &&
              (() => {
                const amenitiesByCategory = property.amenities.reduce(
                  (acc, propertyAmenity) => {
                    const category = propertyAmenity.amenity?.category || 'interieur';
                    if (!acc[category]) {
                      acc[category] = [];
                    }
                    acc[category].push(propertyAmenity);
                    return acc;
                  },
                  {} as Record<string, typeof property.amenities>
                );

                return (
                  <Card className="bg-white p-4 shadow-sm">
                    <CardBody className="pt-0">
                      <div className="space-y-6">
                        {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                          <div key={category}>
                            <h4 className="text-md mb-3 font-semibold text-emerald-700">
                              {amenitiesConfig[category] || category}
                            </h4>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                              {amenities.map((propertyAmenity, index) => {
                                const Icon = getAmenityIcon(propertyAmenity.amenity?.name || '');
                                return (
                                  <div
                                    key={index}
                                    className="flex items-center py-2 text-emerald-900"
                                  >
                                    <Icon className="mr-2 h-4 w-4 text-emerald-600" />
                                    <span className="text-sm">{propertyAmenity.amenity?.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                );
              })()}

            {/* Location */}
            <Card className="overflow-hidden border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-semibold text-emerald-700">Localisation</h3>
                </div>
              </CardHeader>
              <CardBody className="pt-4">
                <div className="space-y-4">
                  <div className="mb-4 flex items-center text-sm text-emerald-900">
                    {property.zipCode && `${property.zipCode}, `}
                    {property.location}
                    {property.address && `, (${property.address})`}
                  </div>

                  {getGoogleMapUrl() ? (
                    <div className="h-80 w-full overflow-hidden rounded-lg border border-gray-200 shadow-md">
                      <iframe
                        src={getGoogleMapUrl()!}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-gray-500">
                      <MapPin className="text-default-400 mx-auto mb-2 h-12 w-12" />
                      <p className="text-sm">Carte interactive bientôt disponible</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Contact Sidebar (1 column) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Agent */}
          <PropertyContactView
            property={property}
            imagesDomain={imagesDomain}
          ></PropertyContactView>

          {/* Property Stats */}
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardHeader className="pb-3 text-center text-emerald-900">
              <h3 className="text-center text-sm text-emerald-700">Informations sur le bien</h3>
            </CardHeader>
            <CardBody className="space-y-3 pt-0">
              {property.reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-primary-900">Référence</span>
                  <span className="font-medium">#{property.reference}</span>
                </div>
              )}
              {property.agencyReference && (
                <div className="flex justify-between text-sm">
                  <span className="text-primary-900">Référence Agence</span>
                  <span className="font-medium">#{property.agencyReference}</span>
                </div>
              )}
              {property.publishedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-primary-900">Publié le</span>
                  <span className="font-medium">
                    {new Date(property.publishedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Similar Properties Slider */}
      <SimilarPropertiesSlider currentProperty={property} imagesDomain={imagesDomain} />

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Connexion requise</ModalHeader>
          <ModalBody>
            <p>Vous devez être connecté pour ajouter des propriétés à vos favoris.</p>
            <p>Souhaitez-vous vous connecter maintenant ?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setShowLoginModal(false)}>
              Annuler
            </Button>
            <Button color="primary" onPress={handleLoginRedirect}>
              Se connecter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
