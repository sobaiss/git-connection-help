'use client';

import {
  MapPin,
  Calendar,
  TreePine,
  Maximize2,
  Grid3x3,
  Bed,
  Bath,
  Layers,
  Building,
  Armchair,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardBody, CardHeader, Divider, Avatar } from '@heroui/react';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import { PropertyImage, PropertyTypeEnum } from '@/types/property';
import { amenitiesConfig, amenitiesIconMap, propertyTypesConfig } from '@/lib/config';
import { LocationHierarchy } from '@/types/location';
import { formatPrice } from '@/lib/utils/pricing';
import { UserTypeEnum } from '@/types/user';

interface PropertyPreviewProps {
  formData: {
    title: string;
    description: string;
    propertyType: PropertyTypeEnum | undefined;
    transactionType: 'achat' | 'location' | undefined;
    price: number | undefined;
    rate: string | undefined;
    area: number | undefined;
    landArea: number | undefined;
    rooms: number | undefined;
    bedrooms: number | undefined;
    bathrooms: number | undefined;
    floor: number | undefined;
    totalFloors: number | undefined;
    yearBuilt: number | undefined;
    location: string;
    zipCode: string;
    address: string;
  };
  imagePreviews: { file: File; previewUrl: string }[];
  selectedAmenities: string[];
  amenitiesMap: Record<string, { id: string; name: string; category: string }>;
  locationHierarchy: LocationHierarchy | null;
  session: any;
  imagesDomain: string;
}

export default function PropertyPreview({
  formData,
  imagePreviews,
  selectedAmenities,
  amenitiesMap,
  locationHierarchy,
  session,
  imagesDomain,
}: PropertyPreviewProps) {
  const propertyImages: PropertyImage[] = imagePreviews.map((preview, index) => ({
    id: `preview-${index}`,
    url: preview.previewUrl,
    order: index,
    createdAt: new Date(),
  }));

  const getAmenityIcon = (amenityName: string): LucideIcon => {
    const normalizedName = amenityName.toLowerCase().trim();
    return amenitiesIconMap[normalizedName] || Armchair;
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

  const amenitiesByCategory = selectedAmenities.reduce(
    (acc, amenityId) => {
      const amenity = amenitiesMap[amenityId];
      if (!amenity) return acc;

      const category = amenity.category || 'interieur';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(amenity);
      return acc;
    },
    {} as Record<string, Array<{ id: string; name: string; category: string }>>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - Images and Details (2 columns) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image Gallery */}
          {propertyImages.length > 0 && (
            <div className="relative">
              <PropertyImageGallery
                property={
                  {
                    id: 'preview',
                    title: formData.title,
                    images: propertyImages,
                  } as any
                }
                images={propertyImages}
                className="w-full"
              />
            </div>
          )}

          {/* Property Header */}
          <Card className="text-foreground bg-white shadow-sm">
            <CardBody className="p-6">
              <div className="mb-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-primary-900 mb-3 text-sm font-bold">
                      <span className="capitalize">
                        {propertyTypesConfig.find((type) => type.value === formData.propertyType)
                          ?.label ?? formData.propertyType?.toLowerCase()}
                      </span>{' '}
                      à {formData.transactionType === 'achat' ? 'acheter' : 'louer'}
                    </h1>
                    <div className="mb-4 flex items-center">
                      <MapPin className="text-primary-600 mr-2 h-4 w-4" />
                      <span className="text-default-800 text-sm">{formData.location}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-primary-900 mb-2 text-lg">
                      <span className="font-bold">
                        {formData.price ? formatPrice(formData.price) : '—'}
                      </span>
                      {formData.rate && <span className="text-gray-500"> / {formData.rate}</span>}
                    </div>
                  </div>
                </div>

                {/* Key Features Bar */}
                <div className="flex flex-wrap gap-8">
                  {formData.area && (
                    <div className="flex items-center">
                      <Maximize2 className="text-primary-600 mr-2 h-4 w-4" />
                      <span className="text-sm">{formData.area}m²</span>
                    </div>
                  )}
                  {formData.landArea &&
                    formData.propertyType &&
                    [
                      PropertyTypeEnum.terrain,
                      PropertyTypeEnum.terrain_agricole,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                      PropertyTypeEnum.bureau_commerce,
                      PropertyTypeEnum.appartement,
                    ].includes(formData.propertyType) && (
                      <div className="flex items-center">
                        <TreePine className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">Jardin {formData.landArea} m²</span>
                      </div>
                    )}
                  {formData.rooms &&
                    formData.propertyType &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                      PropertyTypeEnum.bureau_commerce,
                    ].includes(formData.propertyType) && (
                      <div className="flex items-center">
                        <Grid3x3 className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {formData.rooms} pièce{formData.rooms > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  {formData.bedrooms &&
                    formData.propertyType &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                    ].includes(formData.propertyType) && (
                      <div className="flex items-center">
                        <Bed className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {formData.bedrooms} chambre{formData.bedrooms > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  {formData.bathrooms &&
                    formData.propertyType &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                    ].includes(formData.propertyType) && (
                      <div className="flex items-center">
                        <Bath className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {formData.bathrooms} salle{formData.bathrooms > 1 ? 's' : ''} de bain/eau
                        </span>
                      </div>
                    )}
                  {formData.floor &&
                    formData.propertyType &&
                    [PropertyTypeEnum.appartement, PropertyTypeEnum.bureau_commerce].includes(
                      formData.propertyType
                    ) && (
                      <div className="flex items-center">
                        <Building className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">{formData.floor}e étage</span>
                      </div>
                    )}
                  {formData.totalFloors &&
                    formData.propertyType &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.bureau_commerce,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                    ].includes(formData.propertyType) && (
                      <div className="flex items-center">
                        <Layers className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">{formData.totalFloors} étages total</span>
                      </div>
                    )}
                  {formData.yearBuilt &&
                    formData.propertyType &&
                    [
                      PropertyTypeEnum.appartement,
                      PropertyTypeEnum.maison,
                      PropertyTypeEnum.villa,
                      PropertyTypeEnum.immeuble,
                      PropertyTypeEnum.bureau_commerce,
                    ].includes(formData.propertyType) && (
                      <div className="flex items-center">
                        <Calendar className="text-primary-600 mr-2 h-4 w-4" />
                        <span className="text-sm">
                          Année de construction : {formData.yearBuilt}
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
            {formData.description && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold">Description</h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-default-700 text-base leading-relaxed">
                    {formData.description}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Amenities */}
            {Object.keys(amenitiesByCategory).length > 0 && (
              <Card className="bg-white p-4 shadow-sm">
                <CardBody className="pt-0">
                  <div className="space-y-6">
                    {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                      <div key={category}>
                        <h4 className="text-md text-default-800 mb-3 font-semibold">
                          {amenitiesConfig[category] || category}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {amenities.map((amenity) => {
                            const Icon = getAmenityIcon(amenity.name);
                            return (
                              <div
                                key={amenity.id}
                                className="text-default-700 flex items-center py-2"
                              >
                                <Icon className="text-primary-600 mr-2 h-4 w-4" />
                                <span className="text-sm">{amenity.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Location */}
            <Card className="overflow-hidden bg-white shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Localisation</h3>
                </div>
              </CardHeader>
              <CardBody className="pt-4">
                <div className="space-y-4">
                  <div className="text-default-800 mb-4 flex items-center gap-1">
                    {formData.zipCode && <span className="text-sm">{formData.zipCode}, </span>}
                    <span className="text-sm">{formData.location}</span>
                    {formData.address && <span className="text-sm">, {formData.address}</span>}
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
          <Card className="border-primary-50 border bg-white shadow-sm">
            <CardBody className="p-6">
              <div className="space-y-6">
                {/* Agent/Agency Info */}
                <div className="flex items-center gap-4">
                  <Avatar
                    src={session?.user?.image ? `${imagesDomain}${session.user.image}` : undefined}
                    name={`${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`}
                    size="lg"
                    className="h-16 w-16 flex-shrink-0 text-lg"
                    showFallback
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 truncate text-lg font-bold">
                      {session?.user?.firstName} {session?.user?.lastName}
                    </h3>
                    <p className="text-primary-600 text-sm">
                      {session?.user?.userType === UserTypeEnum.professionnel
                        ? 'Agent Immobilier'
                        : 'Particulier'}
                    </p>
                    {formData.location && (
                      <p className="text-default-800 mt-1 truncate text-sm">{formData.location}</p>
                    )}
                  </div>
                </div>

                <Divider />
                <div className="space-y-3 text-center">
                  <h4 className="text-warning-500 text-lg font-bold">
                    Cette annonce vous intéresse ?
                  </h4>
                  <p className="mt-xs text-sm">
                    Contactez vite{' '}
                    {session?.user?.userType === UserTypeEnum.professionnel
                      ? "l'agence"
                      : 'le propriétaire'}{' '}
                    pour le visiter !
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
