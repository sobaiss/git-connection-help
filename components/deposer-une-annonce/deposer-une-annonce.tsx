'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  CloudUpload,
  MapPin,
  Home,
  Euro,
  Camera,
  FileText,
  Check,
  X,
  AlertTriangle,
  Globe,
  BathIcon,
  BedIcon,
  Grid3x3Icon,
  Maximize2Icon,
  TreePineIcon,
  Calendar1Icon,
  BuildingIcon,
  Layers2Icon,
  LucideCurrency,
  MailIcon,
  PhoneIcon,
  SaveIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SendIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  User2Icon,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Checkbox,
  DatePicker,
  RadioGroup,
  Radio,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { Location, LocationHierarchy } from '@/types/location';
import { getCachedLocations } from '@/lib/utils/location-cache';
import { convertFileToBase64 } from '@/lib/files/files';
import { createProperty } from '@/lib/actions/property';
import AutocompleteLocation from '@/components/ui/AutocompleteLocation';
import { getLocationHierarchy } from '@/lib/utils/location-filter';
import PropertyPreview from './property-preview';
import {
  Amenity,
  PropertyStatusEnum,
  PropertyTransactionTypeEnum,
  PropertyTypeEnum,
  RateTypeEnum,
} from '@/types/property';
import { getCachedAmenities } from '@/lib/utils/amenity-cache';
import {
  amenitiesConfig,
  CURRENCY,
  MAX_FILE_SIZE,
  MAX_IMAGE_COUNT,
  propertyTypesConfig,
  rateTypesConfig,
} from '@/lib/config';
import {
  createPropertyContactSchema,
  createPropertyImagesSchema,
  updatePropertyCaracteristicsSchema,
  updatePropertyLocationSchema,
  updatePropertyPriceSchema,
  updatePropertyTypeSchema,
} from '@/lib/validations/property';
import z from 'zod';
import { User } from 'next-auth';
import { formatPrice, formatPropertyType } from '@/lib/utils/property-infos';

const emptyErrorMessages = {
  address: '',
  area: '',
  availableAt: '',
  bathrooms: '',
  bedrooms: '',
  borough: '',
  city: '',
  contactEmail: '',
  contactFirstName: '',
  contactLastName: '',
  contactPhone: '',
  department: '',
  description: '',
  email: '',
  firstName: '',
  floor: '',
  landArea: '',
  lastName: '',
  length: '',
  location: '',
  neighborhood: '',
  phone: '',
  price: '',
  propertyType: '',
  rate: '',
  region: '',
  rooms: '',
  title: '',
  totalFloors: '',
  transactionType: '',
  width: '',
  yearBuilt: '',
  zipCode: '',
};

const toIntegerOrUndefined = (value: string): number | undefined => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
};

export default function DeposerUneAnnonceView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [cityMap, setCityMap] = useState<Location[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ file: File; previewUrl: string }[]>([]);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchy | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesGroup, setAmenitiesGroup] = useState<Record<string, Amenity[]>>({});
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState(emptyErrorMessages);
  const [showCaracteristiques, setShowCaracteristiques] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [formData, setFormData] = useState({
    address: '',
    area: undefined,
    availableAt: parseDate(today(getLocalTimeZone()).toString()),
    bathrooms: undefined,
    bedrooms: undefined,
    borough: '',
    city: '',
    contactEmail: '',
    contactFirstName: '',
    contactLastName: '',
    contactPhone: '',
    department: '',
    description: '',
    floor: undefined,
    landArea: undefined,
    length: undefined,
    location: '',
    neighborhood: '',
    price: undefined,
    propertyType: undefined,
    rate: RateTypeEnum.unique,
    region: '',
    rooms: undefined,
    title: '',
    totalFloors: undefined,
    transactionType: undefined,
    useUserContact: true,
    width: undefined,
    yearBuilt: undefined,
    zipCode: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/mon-compte/deposer-une-annonce');
      return;
    }
    if (formData.useUserContact) {
      setFormData((prev) => ({
        ...prev,
        contactFirstName: session.user.firstName || prev.contactFirstName,
        contactLastName: session.user.lastName || prev.contactLastName,
        contactEmail: session.user.email || prev.contactEmail,
        contactPhone: session.user.phone || prev.contactPhone,
      }));
    }
  }, [session, status, router]);

  // Track property view on component mount
  useEffect(() => {
    (async () => {
      const locations = await getCachedLocations();
      const cities = locations.filter((location) => location.divisionLevel >= 3);
      setCityMap(cities);

      const amenitiesData = await getCachedAmenities();
      setAmenities(amenitiesData);
      const amenitiesByGroup = amenitiesData.reduce((acc: Record<string, Amenity[]>, amenity) => {
        if (!acc[amenity.category]) {
          acc[amenity.category] = [];
        }
        acc[amenity.category].push({
          id: amenity.id,
          name: amenity.name,
          category: amenity.category,
        });
        return acc;
      }, {});
      setAmenitiesGroup(amenitiesByGroup);
    })();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    const newPreviews: { file: File; previewUrl: string }[] = [];
    setErrorMessages(emptyErrorMessages);

    // Check if adding new files would exceed the limit
    if (selectedFiles.length + files.length > MAX_IMAGE_COUNT) {
      newErrors.push(`Vous ne pouvez ajouter que ${MAX_IMAGE_COUNT} images maximum`);
      setImageErrors(newErrors);
      return;
    }

    files.forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        newErrors.push(`${file.name}: Seuls les fichiers image sont acceptés`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name}: La taille ne peut pas dépasser 5MB`);
        return;
      }

      // Check if file already exists
      if (
        selectedFiles.some(
          (existingFile) => existingFile.name === file.name && existingFile.size === file.size
        )
      ) {
        newErrors.push(`${file.name}: Ce fichier a déjà été ajouté`);
        return;
      }

      validFiles.push(file);
      newPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (newErrors.length > 0) {
      setImageErrors(newErrors);
    } else {
      setImageErrors([]);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }

    // Reset the input value to allow selecting the same file again if needed
    event.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setErrorMessages(emptyErrorMessages);
    const previewToRemove = imagePreviews[index];

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(previewToRemove.previewUrl);

    // Remove from both arrays
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    // Clear any related errors
    setImageErrors([]);
  };

  const handleSubmit = async (status: PropertyStatusEnum) => {
    if (!validateStep()) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    setErrorMessages(emptyErrorMessages);

    try {
      // Convert images to base64
      const images = await Promise.all(
        selectedFiles.map(async (file, index) => {
          const base64 = await convertFileToBase64(file);
          return {
            url: base64,
            alt: `${formData.title || 'Propriété'} - Image ${index + 1}`,
            order: index,
          };
        })
      );

      // Prepare property data
      const propertyData = {
        address: formData.address,
        amenities: selectedAmenities.map((amenityId) => ({ amenityId, amenityCount: 1 })),
        area: formData.area ? parseInt(formData.area) : undefined,
        availableAt: formData.availableAt.toDate(getLocalTimeZone()),
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        borough: formData.borough,
        city: formData.city,
        contact: formData.useUserContact
          ? undefined
          : {
              firstName: formData.contactFirstName,
              email: formData.contactEmail,
              lastName: formData.contactLastName,
              phone: formData.contactPhone,
            },
        department: formData.department,
        description: formData.description,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
        images: images.length > 0 ? images : undefined,
        landArea: formData.landArea ? parseInt(formData.landArea) : undefined,
        length: formData.length ? parseInt(formData.length) : undefined,
        location: formData.location,
        neighborhood: formData.neighborhood,
        price: toIntegerOrUndefined(formData.price ?? '') || 0,
        rate:
          formData.transactionType === PropertyTransactionTypeEnum.achat
            ? RateTypeEnum.unique
            : (formData.rate as unknown as RateTypeEnum),
        region: formData.region,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        status,
        title: formData.title,
        transactionType: formData.transactionType as unknown as PropertyTransactionTypeEnum,
        propertyType: formData.propertyType as unknown as PropertyTypeEnum,
        userUserContact: formData.useUserContact,
        width: formData.width ? parseInt(formData.width) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        zipCode: formData.zipCode,
      };

      const response = await createProperty(propertyData);

      if ('errors' in response) {
        console.log('Validation errors:', response.errors);
        setSubmitError(response.message || "Erreur lors de la création de l'annonce");
        const errors = { ...emptyErrorMessages };

        for (const [field, messages] of Object.entries(response.errors)) {
          console.log('Field error:', field, messages);
          if (Array.isArray(messages)) {
            errors[field as keyof typeof emptyErrorMessages] = messages[0];
          }
        }

        setErrorMessages(errors);

        return;
      } else {
        setSubmitSuccess(true);
        // Redirect to the new property page after a short delay
        setTimeout(() => {
          router.push('/mon-compte/mes-annonces');
        }, 5000);
      }
    } catch (error) {
      console.error('Error creating property:', error);
      setSubmitError("Erreur lors de la création de l'annonce. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Type de bien',
      icon: Home,
      selection:
        formData.propertyType && formData.transactionType
          ? formatPropertyType(formData.propertyType, formData.transactionType)
          : '',
    },
    {
      id: 2,
      title: 'Localisation',
      icon: MapPin,
      selection: formData.location ? formData.location : '',
    },
    { id: 3, title: 'Caractéristiques', icon: FileText, selection: '' },
    {
      id: 4,
      title: 'Prix',
      icon: Euro,
      selection: formData.price ? formatPrice(formData.price, formData.rate) : '',
    },
    { id: 5, title: 'Photos', icon: Camera, selection: '' },
    { id: 6, title: 'Contact', icon: User2Icon, selection: '' },
  ];

  const handleInputChange = (field: string, value: string | boolean | number | undefined) => {
    const data = { [field]: value };
    if (field === 'transactionType') {
      if (value === PropertyTransactionTypeEnum.achat) {
        data['rate'] = RateTypeEnum.unique;
      } else if (value === PropertyTransactionTypeEnum.location) {
        data['rate'] = RateTypeEnum.mois;
      }
    }
    setFormData((prev) => ({ ...prev, ...data }));
    setErrorMessages(emptyErrorMessages);
  };

  const handleLocationInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      region: '',
      department: '',
      city: '',
      borough: '',
      neighborhood: '',
      zipCode: '',
      location: '',
    }));

    if (!value) {
      setLocationHierarchy(null);

      return;
    }

    getLocationHierarchy(value as string).then((hierarchy) => {
      setLocationHierarchy(hierarchy);
      if (!hierarchy) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        region: hierarchy.region?.displayName || '',
        department: hierarchy.department?.displayName || '',
        city: hierarchy.city?.displayName || '',
        borough: hierarchy.borough?.displayName || '',
        neighborhood: hierarchy.neighborhood?.displayName || '',
        zipCode: hierarchy.selected?.zip || '',
        location: value as string,
      }));

      setErrorMessages(emptyErrorMessages);
    });
  };

  const handleAvailabilityDateChange = (date: CalendarDate | null) => {
    setFormData((prev) => ({
      ...prev,
      availableAt: date ? date : parseDate(today(getLocalTimeZone()).toString()),
    }));
    setErrorMessages(emptyErrorMessages);
  };

  const handleUseUserContactChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      useUserContact: value,
      contactFirstName: value
        ? session?.user.firstName || prev.contactFirstName
        : prev.contactFirstName,
      contactLastName: value
        ? session?.user.lastName || prev.contactLastName
        : prev.contactLastName,
      contactEmail: value ? session?.user.email || prev.contactEmail : prev.contactEmail,
      contactPhone: value ? session?.user.phone || prev.contactPhone : prev.contactPhone,
    }));

    setErrorMessages(emptyErrorMessages);
  };

  const validateStep = (): boolean => {
    let validatedFields, fieldErrors;
    setSubmitError('');

    switch (currentStep) {
      case 1:
        validatedFields = updatePropertyTypeSchema.safeParse({
          propertyType: formData.propertyType,
          transactionType: formData.transactionType,
        });
        fieldErrors = validatedFields.error
          ? z.flattenError(validatedFields.error).fieldErrors
          : {};

        break;
      case 2:
        validatedFields = updatePropertyLocationSchema.safeParse({
          city: formData.city,
          location: formData.location,
        });
        fieldErrors = validatedFields.error
          ? z.flattenError(validatedFields.error).fieldErrors
          : {};

        break;
      case 3:
        validatedFields = updatePropertyCaracteristicsSchema.safeParse({
          area: formData.area,
          bathrooms: formData.bathrooms,
          bedrooms: formData.bedrooms,
          description: formData.description,
          floor: formData.floor,
          totalFloors: formData.totalFloors,
          landArea: formData.landArea,
          room: formData.rooms,
          title: formData.title,
          yearBuilt: formData.yearBuilt,
        });
        fieldErrors = validatedFields.error
          ? z.flattenError(validatedFields.error).fieldErrors
          : {};
        break;
      case 4:
        validatedFields = updatePropertyPriceSchema.safeParse({
          price: formData.price,
          rate: formData.rate,
          availableAt: formData.availableAt.toDate(getLocalTimeZone()),
        });
        fieldErrors = validatedFields.error
          ? z.flattenError(validatedFields.error).fieldErrors
          : {};
        break;
      case 5:
        validatedFields = createPropertyImagesSchema.safeParse({
          images: selectedFiles,
        });
        fieldErrors = validatedFields.error
          ? z.flattenError(validatedFields.error).fieldErrors
          : {};
        break;
      case 6:
        validatedFields = createPropertyContactSchema.safeParse({
          contactLastName: formData.contactLastName,
          contactFirstName: formData.contactFirstName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
        });
        fieldErrors = validatedFields.error
          ? z.flattenError(validatedFields.error).fieldErrors
          : {};
        break;
      default:
        return false;
    }

    if (!validatedFields.success && fieldErrors) {
      console.log('Validation errors on step', currentStep);
      console.log('Input data:', formData);
      console.log('Field errors:', fieldErrors);
      // Map fieldErrors to errorMessages structure
      const errors = { ...emptyErrorMessages };

      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (Array.isArray(messages)) {
          if (field === 'images') {
            setImageErrors(messages);
          } else {
            errors[field as keyof typeof emptyErrorMessages] = messages[0];
          }
        }
      }

      // Or, if you want to keep the original structure, just remove this line and rely on fieldErrors directly.
      setErrorMessages(errors);
      setSubmitError('Corrigez les erreurs avant de continuer.');

      return false;
    }

    console.log('Step', currentStep, 'validated successfully');

    return true;
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      if (validateStep()) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-default-900 mb-4 text-3xl font-bold">
                Quel type de bien souhaitez-vous mettre en ligne ?
              </h2>
              <p className="text-default-600 text-lg leading-relaxed">
                Sélectionnez le type de transaction et le type de bien pour commencer votre annonce
              </p>
            </div>

            <div className="space-y-10">
              {/* Transaction Type Section */}
              <div className="mx-auto max-w-4xl">
                <div className="mb-8 text-center">
                  <h3 className="text-default-900 mb-2 text-xl font-semibold">
                    Type de transaction
                  </h3>
                  <p className="text-default-600">
                    Choisissez si vous souhaitez vendre ou louer votre bien
                  </p>
                </div>
                <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 sm:gap-6">
                  <Card
                    isPressable
                    onPress={() =>
                      handleInputChange('transactionType', PropertyTransactionTypeEnum.location)
                    }
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.transactionType === PropertyTransactionTypeEnum.location
                        ? 'border-primary-400 from-primary-50 to-primary-100 border bg-gradient-to-br shadow-none'
                        : 'border-default-300 hover:bg-default-50 border bg-white shadow-none'
                    }`}
                  >
                    <CardBody className="p-4 text-center sm:p-6">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                        <Home
                          className={`h-5 w-5 sm:h-6 sm:w-6 ${formData.transactionType === PropertyTransactionTypeEnum.location ? 'text-primary-600' : 'text-default-400'}`}
                        />
                      </div>
                      <span className="mb-2 block text-base font-bold sm:text-xl">Location</span>
                      <span className="text-xs font-medium opacity-90 sm:text-sm">
                        Je souhaite mettre en location mon bien
                      </span>
                      {formData.transactionType === PropertyTransactionTypeEnum.location && (
                        <div className="mt-2">
                          <Check className="text-primary-600 mx-auto h-5 w-5" />
                        </div>
                      )}
                    </CardBody>
                  </Card>
                  <Card
                    isPressable
                    onPress={() =>
                      handleInputChange('transactionType', PropertyTransactionTypeEnum.achat)
                    }
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.transactionType === PropertyTransactionTypeEnum.achat
                        ? 'border-primary-400 from-primary-50 to-primary-100 border bg-gradient-to-br shadow-none'
                        : 'border-default-300 hover:bg-default-50 border bg-white shadow-none'
                    }`}
                  >
                    <CardBody className="p-4 text-center sm:p-6">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                        <Euro
                          className={`h-5 w-5 sm:h-6 sm:w-6 ${formData.transactionType === PropertyTransactionTypeEnum.achat ? 'text-primary-600' : 'text-default-400'}`}
                        />
                      </div>
                      <span className="mb-2 block text-base font-bold sm:text-xl">Vente</span>
                      <span className="text-xs font-medium opacity-90 sm:text-sm">
                        Je souhaite vendre mon bien
                      </span>
                      {formData.transactionType === PropertyTransactionTypeEnum.achat && (
                        <div className="mt-2">
                          <Check className="text-primary-600 mx-auto h-5 w-5" />
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Property Type Section */}
              <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                  <h3 className="text-default-900 mb-2 text-xl font-semibold">Type de bien</h3>
                  <p className="text-default-600">
                    Sélectionnez la catégorie qui correspond à votre propriété
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-4">
                  {propertyTypesConfig.map((propertyType) => {
                    const Icon = propertyType.icon;
                    return (
                      <Card
                        key={propertyType.value}
                        isPressable
                        onPress={() => handleInputChange('propertyType', propertyType.value)}
                        className={`cursor-pointer transition-all duration-300 ${
                          formData.propertyType === propertyType.value
                            ? 'border-primary-400 from-primary-50 to-primary-100 border bg-gradient-to-br shadow-none'
                            : 'border-default-300 hover:bg-default-50 border bg-white shadow-none'
                        }`}
                      >
                        <CardBody className="p-3 text-center sm:p-6">
                          <div
                            className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center sm:mb-4 sm:h-16 sm:w-16`}
                          >
                            <div
                              className={`[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-8 sm:[&>svg]:w-8 ${formData.propertyType === propertyType.value ? 'text-primary-600' : 'text-default-400'}`}
                            >
                              <Icon className="h-8 w-8 sm:h-8 sm:w-8" />
                            </div>
                          </div>
                          <div className="text-default-900 text-xs leading-tight font-semibold sm:text-sm">
                            {propertyType.label}
                          </div>
                          {formData.propertyType === propertyType.value && (
                            <div className="mt-2">
                              <Check className="text-primary-600 mx-auto h-5 w-5" />
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-default-900 mb-4 text-2xl font-bold">Où se situe votre bien ?</h2>
              <p className="text-default-600 mb-6">
                Indiquez l'adresse complète de votre propriété
              </p>
            </div>

            <div className="max-w-4xl space-y-6">
              <div className="space-y-6">
                <div>
                  <AutocompleteLocation
                    isRequired={true}
                    allowsCustomValue={false}
                    locations={cityMap}
                    selectedLocation={formData.location}
                    setSelectedLocation={(value) => handleLocationInputChange('location', value)}
                    label="Localisation"
                    labelPlacement="outside"
                    placeholder="Rechercher une ville, un quartier, un arrondissement..."
                    errorMessage={errorMessages.location}
                    isInvalid={errorMessages.location !== ''}
                    arial-label="Champ de localisation pour la propriété"
                  />
                </div>
                <div className="mt-12">
                  <Input
                    label="Adresse / indications (optionnelle)"
                    labelPlacement="outside"
                    id="address"
                    placeholder="Près rond-point, à côté de..."
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.address}
                    isInvalid={errorMessages.address !== ''}
                    aria-label="Adresse ou indications supplémentaires pour la propriété"
                  />
                </div>
                <div>
                  <Input
                    isDisabled
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.region}
                    isInvalid={errorMessages.region !== ''}
                    aria-label="Région où se situe la propriété"
                    startContent={<small className="font-bold">Région</small>}
                  />
                </div>

                <div>
                  <Input
                    startContent={<small className="font-bold">Département</small>}
                    isDisabled
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.department}
                    isInvalid={errorMessages.department !== ''}
                    aria-label="Département où se situe la propriété"
                  />
                </div>

                <div>
                  <Input
                    startContent={<small className="font-bold">Arrondissement</small>}
                    isDisabled
                    id="borough"
                    value={formData.borough}
                    onChange={(e) => handleInputChange('borough', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.borough}
                    isInvalid={errorMessages.borough !== ''}
                    aria-label="Arrondissement où se situe la propriété"
                  />
                </div>

                <div>
                  <Input
                    startContent={<small className="font-bold">Code postal</small>}
                    isDisabled
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.zipCode}
                    isInvalid={errorMessages.zipCode !== ''}
                    aria-label="Code postal où se situe la propriété"
                  />
                </div>

                <div>
                  <Input
                    startContent={<small className="font-bold">Ville</small>}
                    isDisabled
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.city}
                    isInvalid={errorMessages.city !== ''}
                    aria-label="Ville où se situe la propriété"
                  />
                </div>

                <div>
                  <Input
                    startContent={<small className="font-bold">Quartier</small>}
                    isDisabled
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    errorMessage={errorMessages.neighborhood}
                    isInvalid={errorMessages.neighborhood !== ''}
                    aria-label="Quartier où se situe la propriété"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-default-900 mb-4 text-2xl font-bold">Caractéristiques du bien</h2>
              <p className="text-default-600 mb-6">
                Décrivez les principales caractéristiques de votre bien
              </p>
            </div>

            <div className="max-w-5xl space-y-8">
              <div>
                <Textarea
                  id="description"
                  label="Description du bien"
                  labelPlacement="outside"
                  placeholder="Décrivez votre bien, ses atouts, son environnement..."
                  minRows={3}
                  value={formData.description}
                  onValueChange={(value) => handleInputChange('description', value)}
                  size="lg"
                  variant="bordered"
                  radius="lg"
                  isRequired
                  errorMessage={errorMessages.description}
                  isInvalid={errorMessages.description !== ''}
                  aria-label="Description détaillée de la propriété"
                />
              </div>
              <div className="mt-12">
                <Input
                  id="title"
                  label="Titre de l'annonce"
                  labelPlacement="outside"
                  placeholder="Ex: Bel appartement lumineux avec balcon"
                  value={formData.title}
                  onValueChange={(value) => handleInputChange('title', value)}
                  size="lg"
                  variant="bordered"
                  radius="lg"
                  errorMessage={errorMessages.title}
                  isInvalid={errorMessages.title !== ''}
                  aria-label="Titre de l'annonce pour la propriété"
                />
              </div>
              {formData.propertyType &&
                ![PropertyTypeEnum.terrain, PropertyTypeEnum.terrain_agricole].includes(
                  formData.propertyType
                ) && (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
                    {formData.propertyType &&
                      [
                        PropertyTypeEnum.maison,
                        PropertyTypeEnum.villa,
                        PropertyTypeEnum.immeuble,
                        PropertyTypeEnum.bureau_commerce,
                        PropertyTypeEnum.appartement,
                      ].includes(formData.propertyType) && (
                        <div>
                          <Input
                            id="rooms"
                            label="Nombre de pièces"
                            labelPlacement="outside"
                            type="number"
                            value={formData.rooms}
                            onValueChange={(value) =>
                              handleInputChange('rooms', toIntegerOrUndefined(value))
                            }
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            min={0}
                            startContent={<Grid3x3Icon className="text-default-400 h-4 w-4" />}
                            errorMessage={errorMessages.rooms}
                            isInvalid={errorMessages.rooms !== ''}
                            aria-label="Nombre de pièces de la propriété"
                          />
                        </div>
                      )}
                    {formData.propertyType &&
                      [
                        PropertyTypeEnum.maison,
                        PropertyTypeEnum.villa,
                        PropertyTypeEnum.appartement,
                      ].includes(formData.propertyType) && (
                        <div>
                          <Input
                            id="bedrooms"
                            label="Nombre de chambres"
                            labelPlacement="outside"
                            type="number"
                            value={formData.bedrooms}
                            onValueChange={(value) =>
                              handleInputChange('bedrooms', toIntegerOrUndefined(value))
                            }
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            min={0}
                            startContent={<BedIcon className="text-default-400 h-4 w-4" />}
                            errorMessage={errorMessages.bedrooms}
                            isInvalid={errorMessages.bedrooms !== ''}
                            aria-label="Nombre de chambres de la propriété"
                          />
                        </div>
                      )}
                    {formData.propertyType &&
                      [
                        PropertyTypeEnum.maison,
                        PropertyTypeEnum.villa,
                        PropertyTypeEnum.immeuble,
                        PropertyTypeEnum.bureau_commerce,
                        PropertyTypeEnum.appartement,
                      ].includes(formData.propertyType) && (
                        <div>
                          <Input
                            id="bathrooms"
                            label="Nombre de salles de bain"
                            labelPlacement="outside"
                            type="number"
                            value={formData.bathrooms}
                            onValueChange={(value) =>
                              handleInputChange('bathrooms', toIntegerOrUndefined(value))
                            }
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            min={0}
                            startContent={<BathIcon className="text-default-400 h-4 w-4" />}
                            errorMessage={errorMessages.bathrooms}
                            isInvalid={errorMessages.bathrooms !== ''}
                            aria-label="Nombre de salles de bain de la propriété"
                          />
                        </div>
                      )}
                  </div>
                )}

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                <div>
                  <Input
                    id="area"
                    label="Surface (m²)"
                    labelPlacement="outside"
                    type="number"
                    value={formData.area}
                    onValueChange={(value) =>
                      handleInputChange('area', toIntegerOrUndefined(value))
                    }
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    min={0}
                    startContent={<Maximize2Icon className="text-default-400 h-4 w-4" />}
                    errorMessage={errorMessages.area}
                    isInvalid={errorMessages.area !== ''}
                    aria-label="Surface de la propriété en mètres carrés"
                  />
                </div>
                {formData.propertyType &&
                  [
                    PropertyTypeEnum.maison,
                    PropertyTypeEnum.villa,
                    PropertyTypeEnum.immeuble,
                    PropertyTypeEnum.bureau_commerce,
                    PropertyTypeEnum.appartement,
                  ].includes(formData.propertyType) && (
                    <div>
                      <Input
                        id="landArea"
                        label="Surface totale du terrain (m²)"
                        labelPlacement="outside"
                        type="number"
                        value={formData.landArea}
                        onValueChange={(value) =>
                          handleInputChange('landArea', toIntegerOrUndefined(value))
                        }
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        min={0}
                        startContent={<TreePineIcon className="text-default-400 h-4 w-4" />}
                        errorMessage={errorMessages.landArea}
                        isInvalid={errorMessages.landArea !== ''}
                        aria-label="Surface totale du terrain de la propriété en mètres carrés"
                      />
                    </div>
                  )}
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                <div>
                  <Input
                    id="length"
                    label="Longueur (m)"
                    labelPlacement="outside"
                    type="number"
                    value={formData.length}
                    onValueChange={(value) =>
                      handleInputChange('length', toIntegerOrUndefined(value))
                    }
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    min={0}
                    startContent={<Maximize2Icon className="text-default-400 h-4 w-4" />}
                    errorMessage={errorMessages.length}
                    isInvalid={errorMessages.length !== ''}
                    aria-label="Longueur de la propriété en mètres"
                  />
                </div>
                <div>
                  <Input
                    id="width"
                    label="Largeur (m)"
                    labelPlacement="outside"
                    type="number"
                    value={formData.width}
                    onValueChange={(value) =>
                      handleInputChange('width', toIntegerOrUndefined(value))
                    }
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    min={0}
                    startContent={<Maximize2Icon className="text-default-400 h-4 w-4" />}
                    errorMessage={errorMessages.width}
                    isInvalid={errorMessages.width !== ''}
                    aria-label="Largeur de la propriété en mètres"
                  />
                </div>
              </div>
              {formData.propertyType &&
                [
                  PropertyTypeEnum.maison,
                  PropertyTypeEnum.villa,
                  PropertyTypeEnum.immeuble,
                  PropertyTypeEnum.bureau_commerce,
                  PropertyTypeEnum.appartement,
                ].includes(formData.propertyType) && (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                    {formData.propertyType &&
                      [PropertyTypeEnum.bureau_commerce, PropertyTypeEnum.appartement].includes(
                        formData.propertyType
                      ) && (
                        <div>
                          <Input
                            id="floor"
                            label="Étage"
                            labelPlacement="outside"
                            type="number"
                            value={formData.floor}
                            onValueChange={(value) =>
                              handleInputChange('floor', toIntegerOrUndefined(value))
                            }
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            min={0}
                            startContent={<BuildingIcon className="text-default-400 h-4 w-4" />}
                            errorMessage={errorMessages.floor}
                            isInvalid={errorMessages.floor !== ''}
                            aria-label="Étage où se situe la propriété"
                          />
                        </div>
                      )}
                    {formData.propertyType &&
                      [
                        PropertyTypeEnum.villa,
                        PropertyTypeEnum.maison,
                        PropertyTypeEnum.immeuble,
                        PropertyTypeEnum.bureau_commerce,
                        PropertyTypeEnum.appartement,
                      ].includes(formData.propertyType) && (
                        <div>
                          <Input
                            id="totalFloors"
                            label="Nombre total d'étages"
                            labelPlacement="outside"
                            type="number"
                            value={formData.totalFloors}
                            onValueChange={(value) =>
                              handleInputChange('totalFloors', toIntegerOrUndefined(value))
                            }
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            min={0}
                            startContent={<Layers2Icon className="text-default-400 h-4 w-4" />}
                            errorMessage={errorMessages.totalFloors}
                            isInvalid={errorMessages.totalFloors !== ''}
                            aria-label="Nombre total d'étages de la propriété"
                          />
                        </div>
                      )}
                    {formData.propertyType &&
                      [
                        PropertyTypeEnum.maison,
                        PropertyTypeEnum.villa,
                        PropertyTypeEnum.immeuble,
                        PropertyTypeEnum.bureau_commerce,
                        PropertyTypeEnum.appartement,
                      ].includes(formData.propertyType) && (
                        <div>
                          <Input
                            id="yearBuilt"
                            label="Année de construction"
                            labelPlacement="outside"
                            type="number"
                            value={formData.yearBuilt}
                            onValueChange={(value) =>
                              handleInputChange('yearBuilt', toIntegerOrUndefined(value))
                            }
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            min={1900}
                            max={new Date().getFullYear()}
                            startContent={<Calendar1Icon className="text-default-400 h-4 w-4" />}
                            errorMessage={errorMessages.yearBuilt}
                            isInvalid={errorMessages.yearBuilt !== ''}
                            aria-label="Année de construction de la propriété"
                          />
                        </div>
                      )}
                  </div>
                )}

              {/* Caracteristiques Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                    <Check className="text-primary-600 h-5 w-5" />
                    Caractéristiques
                  </h4>
                  <Button
                    variant="bordered"
                    radius="full"
                    size="sm"
                    onPress={() => setShowCaracteristiques(!showCaracteristiques)}
                    className="text-primary-900 border-primary-600 hover:border-primary hover:bg-primary border bg-white text-xs"
                    endContent={
                      showCaracteristiques ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    }
                  >
                    {showCaracteristiques ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
                {showCaracteristiques && (
                  <Card className="border-default-300 border bg-white p-4 shadow-none">
                    <CardBody className="p-0">
                      <div className="space-y-6">
                        {Object.keys(amenitiesGroup).map((category) => (
                          <div key={category} className="space-y-3">
                            <h5 className="text-default-800 flex items-center gap-2 text-base font-semibold">
                              <Globe className="text-success-600 h-4 w-4" />
                              {amenitiesConfig[category] || category}
                            </h5>
                            <Divider className="my-2" />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                              {amenitiesGroup[category].map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className="hover:border-default-300 flex items-center space-x-2 rounded-lg p-2 transition-colors"
                                >
                                  <Checkbox
                                    size="sm"
                                    isSelected={selectedAmenities.includes(amenity.id)}
                                    onValueChange={(checked) => {
                                      if (checked) {
                                        setSelectedAmenities((prev) => [...prev, amenity.id]);
                                      } else {
                                        setSelectedAmenities((prev) =>
                                          prev.filter((id) => id !== amenity.id)
                                        );
                                      }
                                    }}
                                  >
                                    <span className="text-sm font-medium">{amenity.name}</span>
                                  </Checkbox>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-default-900 mb-4 text-2xl font-bold">
                Quel est le prix de votre bien ?
              </h2>
              <p className="text-default-600 mb-6">
                {formData.transactionType === 'achat'
                  ? 'Indiquez le prix de vente souhaité'
                  : 'Indiquez le loyer mensuel souhaité'}
              </p>
            </div>

            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      id="price"
                      label={formData.transactionType === 'achat' ? 'Prix de vente' : 'Loyer'}
                      labelPlacement="outside"
                      type="number"
                      value={formData.price}
                      onValueChange={(value) =>
                        handleInputChange('price', toIntegerOrUndefined(value))
                      }
                      size="lg"
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        input: 'text-xl font-semibold',
                      }}
                      min={0}
                      startContent={<LucideCurrency className="text-default-400 h-4 w-4" />}
                      endContent={<span className="text-default-400">{CURRENCY}</span>}
                      errorMessage={errorMessages.price}
                      isInvalid={errorMessages.price !== ''}
                      isRequired
                      aria-required="true"
                      aria-label={
                        formData.transactionType === PropertyTransactionTypeEnum.achat
                          ? 'Prix de vente'
                          : 'Loyer'
                      }
                    />
                    <span className="text-default-600 ml-3 text-sm">
                      {formData.price ? formatPrice(formData.price, formData.rate) : ''}
                    </span>
                  </div>
                </div>

                <div className="relative mt-2">
                  <Select
                    id="rate"
                    label="Période"
                    labelPlacement="outside"
                    selectedKeys={[formData.rate]}
                    onSelectionChange={(keys) => {
                      handleInputChange('rate', Array.from(keys)[0] as string);
                    }}
                    placeholder="Sélectionner"
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    aria-label="Sélectionner la période"
                    errorMessage={errorMessages.rate}
                    isInvalid={errorMessages.rate !== ''}
                    selectionMode="single"
                  >
                    {formData.transactionType === PropertyTransactionTypeEnum.location ? (
                      <>
                        {rateTypesConfig.map((rate) => (
                          <SelectItem key={rate.value}>{rate.label}</SelectItem>
                        ))}
                      </>
                    ) : (
                      <>
                        <SelectItem key={RateTypeEnum.unique}>Unique</SelectItem>
                      </>
                    )}
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <label htmlFor="availableAt" className="mb-2 block text-lg font-medium">
                  Disponible à partir de
                </label>
                <DatePicker
                  id="availableAt"
                  minValue={today(getLocalTimeZone())}
                  onChange={handleAvailabilityDateChange}
                  value={formData.availableAt}
                  variant="bordered"
                  size="lg"
                  radius="lg"
                  label=""
                  labelPlacement="outside"
                  showMonthAndYearPickers
                  aria-label="Sélectionner une date de disponibilité"
                  errorMessage={errorMessages.availableAt}
                  isInvalid={errorMessages.availableAt !== ''}
                  isRequired
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-default-900 mb-4 text-2xl font-bold">
                Ajoutez des photos de votre bien
              </h2>
              <p className="text-default-600 mb-6">
                Les annonces avec photos reçoivent 5 fois plus de contacts
              </p>
            </div>

            <div className="space-y-6">
              {/* Error Messages */}
              {imageErrors.length > 0 && (
                <div className="bg-danger-50 border-danger-200 rounded-lg border p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="text-danger-600 mt-0.5 mr-3 h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="text-danger-800 mb-2 text-sm font-medium">
                        Erreurs de téléchargement :
                      </h4>
                      <ul className="text-danger-700 space-y-1 text-sm">
                        {imageErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div className="border-default-300 hover:border-primary-400 text-foreground rounded-xl border-2 border-dashed p-8 text-center transition-colors lg:p-12">
                <CloudUpload className="text-default-400 mx-auto mb-4 h-12 w-12" />
                <h3 className="text-default-900 mb-2 text-lg font-medium">
                  {selectedFiles.length === 0
                    ? 'Ajoutez vos photos'
                    : `${selectedFiles.length}/4 photos ajoutées`}
                </h3>
                <p className="text-default-600 mb-4">
                  Glissez vos photos ici ou cliquez pour sélectionner des fichiers
                </p>
                <p className="text-default-500 mb-4 text-sm">
                  Maximum 4 images • 5MB par image • Formats acceptés: JPG, PNG, WebP
                </p>

                <input
                  type="file"
                  id="property-images"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={selectedFiles.length >= 4}
                />
                <label htmlFor="property-images">
                  <Button
                    as="span"
                    variant="bordered"
                    isDisabled={selectedFiles.length >= 4}
                    className="cursor-pointer"
                    radius="full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {selectedFiles.length >= 4 ? 'Limite atteinte' : 'Choisir des photos'}
                  </Button>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-default-900 text-lg font-medium">Photos sélectionnées</h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="group relative">
                        <div className="border-default-200 hover:border-primary-300 aspect-square overflow-hidden rounded-xl border-2 transition-colors">
                          <Image
                            src={preview.previewUrl}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="bg-danger-500 hover:bg-danger-600 absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Supprimer cette image"
                          aria-label="Supprimer cette image"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                          {index === 0 ? 'Principal' : `Image ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-default-600 text-sm">
                    La première image sera utilisée comme photo principale de votre annonce.
                  </p>
                </div>
              )}

              {/* Tips */}
              <div className="bg-primary-50 border-primary-200 rounded-xl border p-6">
                <h3 className="text-primary-900 mb-2 font-medium">
                  Conseils pour de belles photos
                </h3>
                <ul className="text-primary-800 space-y-1 text-sm">
                  <li>• Prenez des photos en haute résolution et bien éclairées</li>
                  <li>• Privilégiez la lumière naturelle pour un rendu optimal</li>
                  <li>• Montrez les pièces principales et les atouts du bien</li>
                  <li>• Incluez des vues extérieures si possible (façade, jardin, balcon)</li>
                  <li>• Évitez les photos floues ou mal cadrées</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-default-900 mb-4 text-2xl font-bold">
                Vos informations de contact
              </h2>
              <p className="text-default-600 mb-6">
                Ces informations seront visibles par les personnes intéressées
              </p>
            </div>

            <div className="max-w-2xl space-y-6">
              <RadioGroup
                value={formData.useUserContact ? 'user' : 'new'}
                onValueChange={(value) => handleUseUserContactChange(value === 'user')}
                label="Informations de contact"
                className="mb-6"
              >
                <Radio value="user" size="md">
                  Utiliser mes informations de contact
                </Radio>
                <Radio value="new" size="md">
                  Utiliser un nouveau contact
                </Radio>
              </RadioGroup>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
                <div>
                  <Input
                    id="contactFirstName"
                    label="Prénom"
                    labelPlacement="outside"
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    value={formData.contactFirstName}
                    onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
                    isReadOnly={formData.useUserContact}
                    errorMessage={errorMessages.contactFirstName}
                    isInvalid={errorMessages.contactFirstName !== ''}
                    aria-label="Prénom du contact"
                  />
                </div>
                <div>
                  <Input
                    id="contactLastName"
                    label="Nom"
                    labelPlacement="outside"
                    size="lg"
                    variant="bordered"
                    radius="lg"
                    value={formData.contactLastName}
                    onChange={(e) => handleInputChange('contactLastName', e.target.value)}
                    isReadOnly={formData.useUserContact}
                    errorMessage={errorMessages.contactLastName}
                    isInvalid={errorMessages.contactLastName !== ''}
                    isRequired
                    aria-label="Nom du contact"
                  />
                </div>
              </div>

              <div className="mt-12">
                <Input
                  id="contactEmail"
                  label="Adresse email"
                  labelPlacement="outside"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  type="email"
                  startContent={<MailIcon className="text-default-400 h-4 w-4" />}
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  isReadOnly={formData.useUserContact}
                  errorMessage={errorMessages.contactEmail}
                  isInvalid={errorMessages.contactEmail !== ''}
                  isRequired
                  aria-label="Adresse email du contact"
                />
              </div>

              <div className="mt-12">
                <Input
                  id="contactPhone"
                  label="Numéro de téléphone"
                  labelPlacement="outside"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  type="tel"
                  startContent={<PhoneIcon className="text-default-400 h-4 w-4" />}
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  isReadOnly={formData.useUserContact}
                  errorMessage={errorMessages.contactPhone}
                  isInvalid={errorMessages.contactPhone !== ''}
                  isRequired
                  aria-label="Numéro de téléphone du contact"
                />
              </div>

              <div className="bg-default-50 border-success-200 rounded-xl border p-6">
                <h3 className="text-success-900 mb-2 font-medium">Votre annonce est complète !</h3>
                <p className="text-success-800 pb-2 text-sm">
                  Cliquez sur{' '}
                  <span className="text-success-700 font-medium">"Envoyer l'annonce"</span> pour
                  demander la publication de votre annonce sur notre plateforme. Elle sera mise en
                  ligne après validation par notre équipe (sous 2h maximum).
                </p>
                <p className="text-success-800 text-sm">
                  Cliquez sur{' '}
                  <span className="text-success-700 font-medium">"Enregistrer le brouillon"</span>{' '}
                  pour sauvegarder votre annonce et y revenir plus tard.
                </p>
              </div>

              {/* Submit Status Messages */}
              {submitError && (
                <div className="bg-danger-50 border-danger-200 rounded-lg border p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="text-danger-600 mt-0.5 mr-3 h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="text-danger-800 mb-1 text-sm font-medium">Erreur</h4>
                      <p className="text-danger-700 text-sm">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div className="bg-success-50 border-success-200 rounded-lg border p-4">
                  <div className="flex items-start">
                    <Check className="text-success-600 mt-0.5 mr-3 h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="text-success-800 mb-1 text-sm font-medium">Succès !</h4>
                      <p className="text-success-700 text-sm">
                        Votre annonce a été créée avec succès. Redirection en cours...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
          <div className="h-32 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  // Show loading state or redirect page if not authenticated
  // TypeScript narrowing doesn't account for async state updates, so we check both conditions
  if ((status as string) === 'loading' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  const user: User = session.user;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="mb-4 inline-flex items-center text-blue-900 hover:text-blue-800">
          <ArrowLeft className="text-primary-900 mr-2 h-4 w-4" />
          Retour à l'accueil
        </Link>
        <h1 className="text-default-900 text-3xl font-bold">Déposer une annonce</h1>
        <p className="text-default-600 mt-2">Vendez ou louez votre bien rapidement et facilement</p>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar - Enhanced Progress Steps */}
        <div className="flex-shrink-0 lg:w-80 xl:w-96">
          {/* Compact version for small screens */}
          <Card className="mb-4 border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-md lg:hidden">
            <CardBody className="p-3">
              {(() => {
                const currentStepData = steps.find((step) => step.id === currentStep);
                const Icon = currentStepData?.icon || FileText;
                return (
                  <div className="flex items-center gap-3">
                    <div className="from-primary-500 to-primary-600 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-default-600 text-xs">
                        Étape {currentStep} sur {steps.length}
                      </div>
                      <div className="text-default-900 text-sm font-semibold">
                        {currentStepData?.title}
                      </div>
                    </div>
                    <div className="text-default-600 text-xs font-medium">
                      {Math.round((currentStep / steps.length) * 100)}%
                    </div>
                  </div>
                );
              })()}
              <div className="bg-default-200 mt-2 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="from-primary-500 to-primary-600 h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Full version for large screens */}
          <Card className="sticky top-24 hidden border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-xl lg:block">
            <CardHeader className="text-foreground pb-4">
              <div className="flex items-center gap-3">
                <div className="from-primary-500 to-primary-600 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-default-900 text-xl font-bold">Progression</h3>
                  <p className="text-default-600 text-sm">
                    Étape {currentStep} sur {steps.length}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="ml-4">
                <div className="text-default-600 mb-2 flex justify-between text-xs font-medium">
                  <span>Progression</span>
                  <span className="ml-1">{Math.round((currentStep / steps.length) * 100)}%</span>
                </div>
                <div className="bg-default-200 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="from-primary-500 to-primary-600 h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="relative">
                      <div
                        className={`flex items-center p-3 transition-all duration-300 ${
                          isActive
                            ? 'bg-primary-100'
                            : isCompleted
                              ? 'bg-primary-50'
                              : 'hover:bg-default-50 border border-transparent'
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center transition-all duration-300 ${
                            isCompleted
                              ? 'text-primary-600'
                              : isActive
                                ? 'text-primary-600'
                                : 'text-default-400'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-6 w-6" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <div
                            className={`text-sm font-semibold transition-colors ${
                              isActive
                                ? 'text-primary-900'
                                : isCompleted
                                  ? 'text-success-700'
                                  : 'text-default-500'
                            }`}
                          >
                            Étape {step.id}
                          </div>
                          <div
                            className={`text-sm font-medium transition-colors ${
                              isActive
                                ? 'text-primary-700'
                                : isCompleted
                                  ? 'text-success-600'
                                  : 'text-default-400'
                            }`}
                          >
                            {step.title}
                          </div>
                          {step.selection && (
                            <div className="text-default-900 mt-1 text-sm">{step.selection}</div>
                          )}
                        </div>
                        {isActive && (
                          <div className="bg-primary-600 h-2 w-2 animate-pulse rounded-full" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Step Content */}
          <Card className="text-foreground mb-8 max-w-none border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
            <CardBody className="p-6 lg:p-8 xl:p-10">{renderStepContent()}</CardBody>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {currentStep === steps.length ? (
              <>
                {/* Mobile order: Preview, Envoyer, Enregistrer, Précédent */}
                {/* Desktop order: Précédent, Preview, Enregistrer, Envoyer */}
                <Button
                  variant="bordered"
                  onPress={prevStep}
                  isDisabled={currentStep === 1}
                  size="lg"
                  radius="full"
                  className="text-default-900 bg-default-100 border-default-600 hover:border-default hover:bg-default-200 order-4 border px-8 py-3 sm:order-1"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="bordered"
                  size="lg"
                  radius="full"
                  onPress={() => setShowPreviewModal(true)}
                  className="text-default-900 bg-default-100 border-default-600 hover:border-default hover:bg-default-200 order-1 border px-8 py-3 sm:order-2"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Aperçu
                </Button>
                <Button
                  color="success"
                  size="lg"
                  radius="full"
                  onPress={() => handleSubmit(PropertyStatusEnum.attente_validation)}
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting || submitSuccess}
                  className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary order-2 border px-8 py-3 sm:order-3"
                >
                  <SendIcon className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? 'Publication en cours...'
                    : submitSuccess
                      ? 'Annonce envoyée !'
                      : "Envoyer l'annonce"}
                </Button>
                <Button
                  color="secondary"
                  size="lg"
                  radius="full"
                  onPress={() => handleSubmit(PropertyStatusEnum.brouillon)}
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting || submitSuccess}
                  className="text-secondary-900 bg-secondary-100 border-secondary-600 hover:border-secondary hover:bg-secondary order-3 border px-8 py-3 sm:order-4"
                >
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? 'Enregistrement en cours...'
                    : submitSuccess
                      ? 'Annonce enregistrée !'
                      : 'Enregistrer'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onPress={nextStep}
                  isDisabled={
                    (currentStep === 1 &&
                      (errorMessages.propertyType !== '' ||
                        errorMessages.transactionType !== '')) ||
                    (currentStep === 2 &&
                      (errorMessages.location !== '' || errorMessages.city !== '')) ||
                    (currentStep === 3 &&
                      (errorMessages.title !== '' || errorMessages.description !== '')) ||
                    (currentStep === 4 && errorMessages.price !== '') ||
                    (currentStep === 6 &&
                      (errorMessages.contactFirstName !== '' ||
                        errorMessages.contactEmail !== '' ||
                        errorMessages.contactPhone !== ''))
                  }
                  color="primary"
                  size="lg"
                  radius="full"
                  className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary order-1 border px-8 py-3 sm:order-2"
                >
                  <ArrowRightIcon className="mr-2 h-4 w-4" />
                  Suivant
                </Button>
                <Button
                  variant="bordered"
                  onPress={prevStep}
                  isDisabled={currentStep === 1}
                  size="lg"
                  radius="full"
                  className="text-default-900 bg-default-100 border-default-600 hover:border-default hover:bg-default-200 order-2 border px-8 py-3 sm:order-1"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        size="full"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="bg-background border-content4 flex flex-col gap-1 border-b shadow-sm">
            <h2 className="text-xl font-bold">Aperçu de votre annonce</h2>
            <p className="text-sm font-normal text-gray-600">
              Voici comment votre annonce apparaîtra aux visiteurs
            </p>
          </ModalHeader>
          <ModalBody className="bg-white pt-5">
            <PropertyPreview
              formData={formData}
              imagePreviews={imagePreviews}
              selectedAmenities={selectedAmenities}
              amenitiesMap={amenities.reduce(
                (acc, amenity) => {
                  acc[amenity.id] = amenity;
                  return acc;
                },
                {} as Record<string, { id: string; name: string; category: string }>
              )}
              locationHierarchy={locationHierarchy}
              session={session}
              imagesDomain={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
