'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Grid2X2,
  List,
  X,
  Home,
  Building,
  Globe,
  Check,
  Calendar,
  UserIcon,
  Maximize2,
  LucideCurrency,
  TreePineIcon,
  Grid3x3,
  Bed,
  MapPin,
} from 'lucide-react';
import {
  Button,
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip,
  Checkbox,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  DatePicker,
  Pagination,
  addToast,
} from '@heroui/react';
import PropertyCard from '@/components/PropertyCard';
import { Amenity, Property } from '@/types/property';
import { getProperties, PropertyFilters } from '@/lib/actions/property';
import { getCachedLocations } from '@/lib/utils/location-cache';
import { Location } from '@/types/location';
import { getCachedAmenities } from '@/lib/utils/amenity-cache';
import {
  CURRENCY,
  ITEMS_PER_PAGE,
  propertyTypesConfig,
  sortOptionsSearchConfig,
} from '@/lib/config';
import AutocompleteLocation from '@/components/ui/AutocompleteLocation';
import SelectTransaction from '@/components/ui/SelectTransaction';
import { signOut, useSession } from 'next-auth/react';
import { getUserBookmarks } from '@/lib/actions/user';

const displayRange = (range: number[], metric: string) => {
  if (range[0] === 0 && range[1] === 0) return 'Tous';
  if (range[0] === 0) return `Jusqu'à ${range[1]} ${metric}`;
  if (range[1] === 0) return `À partir de ${range[0]} ${metric}`;
  return `${range[0]}-${range[1]} ${metric}`;
};

export default function SearchResultView({
  imagesDomain,
  showSearchBar = true,
  showBookmarks = false,
}: {
  imagesDomain: string;
  showSearchBar?: boolean;
  showBookmarks?: boolean;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isFetchingRef = useRef(false);
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    searchParams.get('propertyTypes')?.split(',') || []
  );
  const [transactionType, setTransactionType] = useState(searchParams.get('transactionType') || '');
  const [locations, setLocations] = useState<Location[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesGroup, setAmenitiesGroup] = useState<Record<string, Amenity[]>>({});
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [areaRange, setAreaRange] = useState([0, 0]);
  const [landAreaRange, setLandAreaRange] = useState([0, 0]);
  const [bedroomsRange, setBedroomsRange] = useState([0, 0]);
  const [roomsRange, setRoomsRange] = useState([0, 0]);
  const [sortBy, setSortBy] = useState('publishedAt_desc');
  const [agencyId, setAgencyId] = useState(searchParams.get('agencyId') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1') || 1);
  const [limit, setLimit] = useState(
    parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString()) || ITEMS_PER_PAGE
  );
  const [total, setTotal] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Modal state for filters
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Temporary filter state for dialog
  const [tempPropertyTypes, setTempPropertyTypes] = useState<string[]>([]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 0]);
  const [tempAreaRange, setTempAreaRange] = useState([0, 0]);
  const [tempLandAreaRange, setTempLandAreaRange] = useState([0, 0]);
  const [tempBedroomsRange, setTempBedroomsRange] = useState([0, 0]);
  const [tempRoomsRange, setTempRoomsRange] = useState([0, 0]);

  // Features state
  const [features, setFeatures] = useState<string[]>([]);

  // Temporary features state for dialog
  const [tempFeatures, setTempFeatures] = useState<string[]>([]);

  // Available at state
  const [availableAt, setAvailableAt] = useState('');
  const [tempAvailableAt, setTempAvailableAt] = useState('');

  // Proposed by state
  const [proposedBy, setProposedBy] = useState('');
  const [tempProposedBy, setTempProposedBy] = useState('');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (showBookmarks && status === 'unauthenticated') {
      setIsRedirecting(true);
      router.push('/auth/signin');
    }
  }, [status, router, showBookmarks]);

  const createQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set('page', page.toString());
    }
    if (limit !== ITEMS_PER_PAGE) {
      params.set('limit', limit.toString());
    }
    params.set('sortBy', sortBy);
    if (searchLocation) {
      params.set('location', searchLocation);
    }
    if (propertyTypes.length > 0) {
      params.set('propertyTypes', propertyTypes.join(','));
    }
    if (transactionType) {
      params.set('transactionType', transactionType);
    }
    if (priceRange.filter(Boolean).length > 0) {
      params.set('price', priceRange.join(','));
    }
    if (areaRange.filter(Boolean).length > 0) {
      params.set('area', areaRange.join(','));
    }
    if (landAreaRange.filter(Boolean).length > 0) {
      params.set('landArea', landAreaRange.join(','));
    }
    if (bedroomsRange.filter(Boolean).length > 0) {
      params.set('bedrooms', bedroomsRange.join(','));
    }
    if (roomsRange.filter(Boolean).length > 0) {
      params.set('rooms', roomsRange.join(','));
    }
    if (features.length > 0) {
      params.set('amenities', features.join(','));
    }
    if (availableAt) {
      params.set('availableAt', availableAt);
    }
    if (proposedBy) {
      params.set('proposedBy', proposedBy);
    }
    if (agencyId) {
      params.set('agencyId', agencyId);
    }

    return params.toString();
  }, [
    page,
    limit,
    sortBy,
    searchLocation,
    propertyTypes,
    transactionType,
    priceRange,
    areaRange,
    landAreaRange,
    bedroomsRange,
    roomsRange,
    features,
    availableAt,
    proposedBy,
    agencyId,
  ]);

  /**
   * Fetch properties based on current filters and pagination.
   * @returns
   */
  const fetchProperties = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    try {
      const filters: PropertyFilters = {
        location: searchLocation !== '' ? searchLocation : undefined,
        propertyTypes: propertyTypes.length > 0 ? propertyTypes.join(',') : undefined,
        transactionType: transactionType !== '' ? transactionType : undefined,
        price: priceRange.filter(Boolean).length > 0 ? priceRange.join(',') : undefined,
        area: areaRange.filter(Boolean).length > 0 ? areaRange.join(',') : undefined,
        landArea: landAreaRange.filter(Boolean).length > 0 ? landAreaRange.join(',') : undefined,
        rooms: roomsRange.filter(Boolean).length > 0 ? roomsRange.join(',') : undefined,
        bedrooms: bedroomsRange.filter(Boolean).length > 0 ? bedroomsRange.join(',') : undefined,
        ownerType: proposedBy !== '' ? proposedBy : undefined,
        amenities: features.length > 0 ? features.join(',') : undefined,
        availableAt: availableAt !== '' ? availableAt : undefined,
        agencyId: agencyId !== '' ? agencyId : undefined,
      };

      const sortOption = sortOptionsSearchConfig.find((option) => option.value === sortBy);
      let response;
      if (showBookmarks) {
        response = await getUserBookmarks({
          filters,
          page,
          limit,
          sortBy: sortOption?.field,
          sortOrder: sortOption?.order,
        });
      } else {
        response = await getProperties({
          filters,
          page,
          limit,
          sortBy: sortOption?.field,
          sortOrder: sortOption?.order,
        });
      }

      setProperties(response?.properties || []);
      setTotal(response?.pagination.total || 0);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setTotal(0);
      // Handle unauthorized error by signing out
      if (error instanceof Error && error.message === 'Unauthorized') {
        addToast({
          title: 'Session expirée',
          description: 'Veuillez vous reconnecter pour continuer.',
          color: 'danger',
          timeout: 3000,
        });

        setTimeout(() => {
          signOut({
            callbackUrl: '/auth/signin',
          });
        }, 3000);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    searchLocation,
    propertyTypes,
    transactionType,
    priceRange,
    areaRange,
    landAreaRange,
    bedroomsRange,
    roomsRange,
    features,
    availableAt,
    proposedBy,
    page,
    limit,
    sortBy,
    agencyId,
    showBookmarks,
  ]);

  // Initialize filters from URL params
  useEffect(() => {
    const searchPropertyTypes = searchParams.get('propertyTypes');
    if (searchPropertyTypes) {
      setPropertyTypes(searchPropertyTypes.split(','));
    }
    const searchTransactionType = searchParams.get('transactionType');
    if (searchTransactionType) {
      setTransactionType(searchTransactionType);
    }
    const searchLocations = searchParams.get('location');
    if (searchLocations) {
      setSearchLocation(searchLocations);
    }
    const searchPage = searchParams.get('page');
    if (searchPage) {
      setPage(parseInt(searchPage) || 1);
    }
    const searchLimit = searchParams.get('limit');
    if (searchLimit) {
      setLimit(parseInt(searchLimit) || ITEMS_PER_PAGE);
    }
    const searchSortBy = searchParams.get('sortBy');
    if (searchSortBy) {
      setSortBy(searchSortBy);
    }
    const searchViewMode = searchParams.get('viewMode');
    if (searchViewMode && (searchViewMode === 'grid' || searchViewMode === 'list')) {
      setViewMode(searchViewMode);
    }
    const searchPrice = searchParams.get('price');
    if (searchPrice) {
      const priceValues = searchPrice
        .split(',')
        .map((value) => parseInt(value))
        .filter((value) => !isNaN(value));
      if (priceValues.length >= 1) {
        setPriceRange([priceValues[0], priceValues[1] || 0]);
      }
    }
    const searchArea = searchParams.get('area');
    if (searchArea) {
      const areaValues = searchArea
        .split(',')
        .map((value) => parseInt(value))
        .filter((value) => !isNaN(value));
      if (areaValues.length >= 1) {
        setAreaRange([areaValues[0], areaValues[1] || 0]);
      }
    }
    const searchLandArea = searchParams.get('landArea');
    if (searchLandArea) {
      const landAreaValues = searchLandArea
        .split(',')
        .map((value) => parseInt(value))
        .filter((value) => !isNaN(value));
      if (landAreaValues.length >= 1) {
        setLandAreaRange([landAreaValues[0], landAreaValues[1] || 0]);
      }
    }
    const searchBedrooms = searchParams.get('bedrooms');
    if (searchBedrooms) {
      const bedroomsValues = searchBedrooms
        .split(',')
        .map((value) => parseInt(value))
        .filter((value) => !isNaN(value));
      if (bedroomsValues.length >= 1) {
        setBedroomsRange([bedroomsValues[0], bedroomsValues[1] || 0]);
      }
    }
    const searchRooms = searchParams.get('rooms');
    if (searchRooms) {
      const roomsValues = searchRooms
        .split(',')
        .map((value) => parseInt(value))
        .filter((value) => !isNaN(value));
      if (roomsValues.length >= 1) {
        setRoomsRange([roomsValues[0], roomsValues[1] || 0]);
      }
    }

    const searchFeatures = searchParams.get('amenities');
    if (searchFeatures) {
      setFeatures(searchFeatures.split(','));
    }
    const searchAvailableAt = searchParams.get('availableAt');
    if (searchAvailableAt) {
      setAvailableAt(searchAvailableAt);
    }
    const searchProposedBy = searchParams.get('proposedBy');
    if (searchProposedBy) {
      setProposedBy(searchProposedBy);
    }

    const searchAgencyId = searchParams.get('agencyId');
    if (searchAgencyId) {
      setAgencyId(searchAgencyId);
    }

    // Initialize temp filters with current values
    setTempPropertyTypes(propertyTypes);
    setTempPriceRange(priceRange);
    setTempAreaRange(areaRange);
    setTempLandAreaRange(landAreaRange);
    setTempBedroomsRange(bedroomsRange);
    setTempRoomsRange(roomsRange);
    setTempFeatures(features);
    setTempAvailableAt(availableAt);
    setTempProposedBy(proposedBy);

    setIsInitialized(true);
  }, []);

  // 4. Update URL when filters change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      router.push(pathname + '?' + createQueryString());
    }
  }, [isInitialized, createQueryString, router, pathname]);

  // 5. Fetch data with debounce
  useEffect(() => {
    if (!isInitialized) return;

    const debounceTimer = setTimeout(() => {
      fetchProperties();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [isInitialized, fetchProperties]);

  useEffect(() => {
    loadLocations();
    loadAmenities();

    const handleBookmarkRemoved = () => {
      if (showBookmarks) {
        setRefetchTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener('bookmarkRemoved', handleBookmarkRemoved);

    return () => {
      window.removeEventListener('bookmarkRemoved', handleBookmarkRemoved);
    };
  }, [showBookmarks]);

  const loadLocations = async () => {
    await getCachedLocations()
      .then((locations) => {
        setLocations(locations);
      })
      .catch((error) => {
        console.error('Error loading locations:', error);
        setLocations([]);
      });
  };

  const loadAmenities = async () => {
    getCachedAmenities()
      .then((amenities) => {
        setAmenities(amenities);
        const amenitiesByGroup = amenities.reduce((acc: Record<string, Amenity[]>, amenity) => {
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
        // Flatten the grouped amenities into a single array for setAmenities if needed
        setAmenitiesGroup(amenitiesByGroup);
      })
      .catch((error) => {
        console.error('Error loading amenities:', error);
        setAmenitiesGroup({});
      });
  };

  const handleTempPropertyTypeChange = (propertyType: string, checked: boolean) => {
    if (checked) {
      setTempPropertyTypes((prev) => [...prev, propertyType]);
    } else {
      setTempPropertyTypes((prev) => prev.filter((t) => t !== propertyType));
    }
  };

  const openFiltersDialog = () => {
    // Reset temp filters to current values when opening dialog
    setTempPropertyTypes(propertyTypes);
    setTempPriceRange(priceRange);
    setTempAreaRange(areaRange);
    setTempLandAreaRange(landAreaRange);
    setTempBedroomsRange(bedroomsRange);
    setTempRoomsRange(roomsRange);
    setTempFeatures(features);
    setTempAvailableAt(availableAt);
    setTempProposedBy(proposedBy);
    onOpen();
  };

  const applyFilters = () => {
    // Apply temp filters to actual filters
    setPropertyTypes(tempPropertyTypes);
    setPriceRange(tempPriceRange);
    setAreaRange(tempAreaRange);
    setLandAreaRange(tempLandAreaRange);
    setBedroomsRange(tempBedroomsRange);
    setRoomsRange(tempRoomsRange);
    setFeatures(tempFeatures);
    setAvailableAt(tempAvailableAt);
    setProposedBy(tempProposedBy);
    onOpenChange();
  };

  const resetFilters = () => {
    setTempPropertyTypes([]);
    setTempPriceRange([0, 0]);
    setTempAreaRange([0, 0]);
    setTempLandAreaRange([0, 0]);
    setTempBedroomsRange([0, 0]);
    setTempRoomsRange([0, 0]);
    setTempFeatures([]);
    setTempAvailableAt('');
    setTempProposedBy('');
  };

  const handlePropertyTypeChange = (propertyType: string, checked: boolean) => {
    if (checked) {
      setPropertyTypes((prev) => [...prev, propertyType]);
    } else {
      setPropertyTypes((prev) => prev.filter((t) => t !== propertyType));
    }
  };

  const handleLocationChange = (location: string) => {
    setPage(1);
    setSearchLocation(location);
  };

  const handleTransactionTypeChange = (transactionType: string) => {
    setPage(1);
    setTransactionType(transactionType);
  };

  const clearAllFilters = () => {
    setSearchLocation('');
    setPropertyTypes([]);
    setTransactionType('');
    resetFilters();
  };

  const activeFiltersCount = [
    searchLocation,
    propertyTypes.length > 0,
    transactionType !== '',
    priceRange[0] > 0 || priceRange[1] > 0,
    areaRange[0] > 0 || areaRange[1] > 0,
    landAreaRange[0] > 0 || landAreaRange[1] > 0,
    bedroomsRange[0] > 0 || bedroomsRange[1] > 0,
    roomsRange[0] > 0 || roomsRange[1] > 0,
    features.length > 0,
    availableAt !== '',
    proposedBy.length > 0,
  ].filter(Boolean).length;

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated' && showBookmarks) {
      setIsRedirecting(true);
      router.push('/auth/signin');
    }
  }, [status, router, showBookmarks]);

  // Handle scroll event to add shadow to sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 65) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if ((status === 'loading' && showBookmarks) || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">
            {isRedirecting ? 'Redirection vers la page de connexion...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Search Header */}
      {showSearchBar && (
        <div
          className={`sticky top-0 z-40 transition-shadow duration-200 ${isScrolled ? 'bg-white shadow-sm' : ''}`}
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="text-foreground flex flex-row items-center gap-2">
              {/* Search Bar */}
              <div className="flex flex-1 gap-2">
                <div className="flex-[2]">
                  <AutocompleteLocation
                    locations={locations}
                    selectedLocation={searchLocation}
                    setSelectedLocation={handleLocationChange}
                    allowsCustomValue={true}
                  />
                </div>
                <div className="flex-1">
                  <SelectTransaction
                    placeholder="Sélectionner"
                    transactionType={transactionType}
                    setTransactionType={handleTransactionTypeChange}
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                size="md"
                className="bg-content1 hover:bg-content2"
                radius="full"
                onPress={openFiltersDialog}
                isIconOnly
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {/* Display only if showSearchBar is true */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        aria-label="Ouvrir les filtres avancés"
        scrollBehavior="inside"
        classNames={{
          base: 'max-h-[90vh] bg-white',
          body: 'py-6 bg-white',
          header: 'border-b border-content4 bg-white',
          footer: 'border-t border-content4 bg-white',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="from-primary-100 to-primary-200 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
                  <SlidersHorizontal className="text-primary-600 h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-default-900 text-xl font-bold">Filtres Avancés</h3>
                  <p className="text-default-600 text-sm">Affinez votre recherche</p>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-8">
                  {/* Property Types */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <Home className="text-primary-600 h-5 w-5" />
                      Type de Bien
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {propertyTypesConfig.map((propertyType) => {
                        const Icon = propertyType.icon;
                        return (
                          <Card
                            key={propertyType.value}
                            isPressable
                            onPress={() =>
                              handleTempPropertyTypeChange(
                                propertyType.value,
                                !tempPropertyTypes.includes(propertyType.value)
                              )
                            }
                            className={`cursor-pointer transition-all duration-300 ${
                              tempPropertyTypes.includes(propertyType.value)
                                ? 'border-primary-400 from-primary-50 to-primary-100 border bg-gradient-to-br shadow-none'
                                : 'border-default-300 hover:bg-default-50 border bg-white shadow-none'
                            }`}
                          >
                            <CardBody className="p-4 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{propertyType.label}</span>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price and Area Ranges */}
                  {/* Price Range */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <LucideCurrency className="text-primary-600 h-5 w-5" />
                      <span className="text-primary-600">{CURRENCY}</span>
                      Fourchette de Prix
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Prix minimum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={tempPriceRange[0] === 0 ? '' : tempPriceRange[0].toString()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempPriceRange([value, tempPriceRange[1]]);
                                }}
                                startContent={<span className="text-default-400">{CURRENCY}</span>}
                                variant="bordered"
                                size="lg"
                                aria-label="Prix minimum"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Prix maximum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={tempPriceRange[1] === 0 ? '' : tempPriceRange[1].toString()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempPriceRange([tempPriceRange[0], value]);
                                }}
                                startContent={<span className="text-default-400">{CURRENCY}</span>}
                                variant="bordered"
                                size="lg"
                                aria-label="Prix maximum"
                              />
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Area Range */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <Maximize2 className="text-primary-600 h-5 w-5" />
                      Surface (m²)
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Surface minimum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={tempAreaRange[0] === 0 ? '' : tempAreaRange[0].toString()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempAreaRange([value, tempAreaRange[1]]);
                                }}
                                endContent={<span className="text-default-400">m²</span>}
                                variant="bordered"
                                size="lg"
                                aria-label="Surface minimum"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Surface maximum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={tempAreaRange[1] === 0 ? '' : tempAreaRange[1].toString()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempAreaRange([tempAreaRange[0], value]);
                                }}
                                endContent={<span className="text-default-400">m²</span>}
                                variant="bordered"
                                size="lg"
                                aria-label="Surface maximum"
                              />
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Land Area Range */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <TreePineIcon className="text-primary-600 h-5 w-5" />
                      Surface du Terrain (m²)
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Surface terrain minimum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={
                                  tempLandAreaRange[0] === 0 ? '' : tempLandAreaRange[0].toString()
                                }
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempLandAreaRange([value, tempLandAreaRange[1]]);
                                }}
                                endContent={<span className="text-default-400">m²</span>}
                                variant="bordered"
                                size="lg"
                                aria-label="Surface terrain minimum"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Surface terrain maximum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={
                                  tempLandAreaRange[1] === 0 ? '' : tempLandAreaRange[1].toString()
                                }
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempLandAreaRange([tempLandAreaRange[0], value]);
                                }}
                                endContent={<span className="text-default-400">m²</span>}
                                variant="bordered"
                                size="lg"
                                aria-label="Surface terrain maximum"
                              />
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Rooms */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <Grid3x3 className="text-primary-600 h-5 w-5" />
                      Pièces
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Pièces minimum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={tempRoomsRange[0] === 0 ? '' : tempRoomsRange[0].toString()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempRoomsRange([value, tempRoomsRange[1]]);
                                }}
                                startContent={<Home className="text-default-400 h-4 w-4" />}
                                variant="bordered"
                                size="lg"
                                aria-label="Nombre minimum de pièces"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Pièces maximum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={tempRoomsRange[1] === 0 ? '' : tempRoomsRange[1].toString()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempRoomsRange([tempRoomsRange[0], value]);
                                }}
                                startContent={<Home className="text-default-400 h-4 w-4" />}
                                variant="bordered"
                                size="lg"
                                aria-label="Nombre maximum de pièces"
                              />
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Bedrooms */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <Bed className="text-primary-600 h-5 w-5" />
                      Chambres
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Chambres minimum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={
                                  tempBedroomsRange[0] === 0 ? '' : tempBedroomsRange[0].toString()
                                }
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempBedroomsRange([value, tempBedroomsRange[1]]);
                                }}
                                startContent={<Building className="text-default-400 h-4 w-4" />}
                                variant="bordered"
                                size="lg"
                                aria-label="Nombre minimum de chambres"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-default-700 text-sm font-medium">
                                Chambres maximum
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={
                                  tempBedroomsRange[1] === 0 ? '' : tempBedroomsRange[1].toString()
                                }
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempBedroomsRange([tempBedroomsRange[0], value]);
                                }}
                                startContent={<Building className="text-default-400 h-4 w-4" />}
                                variant="bordered"
                                size="lg"
                                aria-label="Nombre maximum de chambres"
                              />
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                  {/* Features */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <Check className="text-primary-600 h-5 w-5" />
                      Caractéristiques
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-6">
                          {Object.keys(amenitiesGroup).map((key) => (
                            <div key={key} className="space-y-3">
                              <h5 className="text-default-800 flex items-center gap-2 text-base font-semibold">
                                <Globe className="text-success-600 h-4 w-4" />
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </h5>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {amenitiesGroup[key].map((amenity) => (
                                  <div
                                    key={amenity.id}
                                    className="hover:border-default-300 flex items-center space-x-2 rounded-lg p-2 transition-colors"
                                  >
                                    <Checkbox
                                      size="sm"
                                      isSelected={tempFeatures.includes(amenity.id)}
                                      onValueChange={(checked) => {
                                        if (checked) {
                                          setTempFeatures((prev) => [...prev, amenity.id]);
                                        } else {
                                          setTempFeatures((prev) =>
                                            prev.filter((f) => f !== amenity.id)
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
                  </div>
                  {/* Available at */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <Calendar className="text-primary-600 h-5 w-5" />
                      Disponible à partir de
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-default-700 text-sm font-medium">
                              Date de disponibilité
                            </label>
                            <DatePicker
                              //value={tempAvailableAt ? new Date(tempAvailableAt) : null}
                              onChange={(date) =>
                                setTempAvailableAt(date ? date.toString().split('T')[0] : '')
                              }
                              variant="bordered"
                              size="lg"
                              aria-label="Date de disponibilité"
                              showMonthAndYearPickers
                            />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Proposed by */}
                  <div className="space-y-4">
                    <h4 className="text-default-900 flex items-center gap-2 text-lg font-semibold">
                      <UserIcon className="text-primary-600 h-5 w-5" />
                      Proposé par
                    </h4>
                    <Card className="border border-gray-200 bg-white p-4 shadow-none">
                      <CardBody className="p-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="hover:border-default-300 flex items-center space-x-2 rounded-lg p-3 transition-colors">
                              <Checkbox
                                size="sm"
                                isSelected={tempProposedBy === 'particulier'}
                                onValueChange={(checked) => {
                                  setTempProposedBy(checked ? 'particulier' : '');
                                }}
                              >
                                <span className="text-sm font-medium">Particulier</span>
                              </Checkbox>
                            </div>
                            <div className="hover:border-default-300 flex items-center space-x-2 rounded-lg p-3 transition-colors">
                              <Checkbox
                                size="sm"
                                isSelected={tempProposedBy === 'professionnel'}
                                onValueChange={(checked) => {
                                  setTempProposedBy(checked ? 'professionnel' : '');
                                }}
                              >
                                <span className="text-sm font-medium">Professionnel</span>
                              </Checkbox>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="gap-3">
                <Button
                  variant="bordered"
                  onPress={onClose}
                  radius="full"
                  className="hover:bg-default-400 border-gray-300"
                >
                  Annuler
                </Button>
                <Button
                  variant="bordered"
                  onPress={resetFilters}
                  startContent={<X className="h-4 w-4" />}
                  radius="full"
                  className="hover:bg-default-400 border-gray-300"
                >
                  Réinitialiser
                </Button>
                <Button
                  color="primary"
                  onPress={applyFilters}
                  startContent={<Search className="h-4 w-4" />}
                  className="bg-emerald-600 font-semibold hover:bg-emerald-700"
                  radius="full"
                >
                  Appliquer les Filtres
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="mx-auto max-w-7xl rounded-lg bg-white px-4 py-6 sm:px-6 lg:px-8">
        {/* Results Header */}
        <Card className="mb-6 bg-transparent shadow-none">
          <CardBody className="text-foreground p-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-emerald-900">
                  {showBookmarks ? 'Mes favoris' : 'Résultats de Recherche'}
                </h1>
                <p className="text-emerald-700">
                  {total} annonce{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
                  {transactionType && ` ${transactionType === 'achat' ? ' à vendre' : ' à louer'}`}
                  {searchLocation && ` - ${searchLocation}`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Select
                  selectionMode="single"
                  selectedKeys={[sortBy]}
                  onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                  className="w-48"
                  aria-label="Trier par"
                >
                  {sortOptionsSearchConfig.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>

                <ButtonGroup>
                  <Button
                    variant={viewMode === 'grid' ? 'solid' : 'bordered'}
                    size="sm"
                    onPress={() => setViewMode('grid')}
                    isIconOnly
                    aria-label="Vue en grille"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'solid' : 'bordered'}
                    size="sm"
                    onPress={() => setViewMode('list')}
                    isIconOnly
                    aria-label="Vue en liste"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && ( // Changed from border-t to border-t border-content4
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  {searchLocation && (
                    <Chip
                      variant="flat"
                      onClose={() => handleLocationChange('')}
                      size="sm"
                      aria-label={`Supprimer le filtre localisation: ${searchLocation}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      <MapPin className="mr-1 inline-block h-4 w-4" /> {searchLocation}
                    </Chip>
                  )}
                  {transactionType !== '' && (
                    <Chip
                      variant="flat"
                      onClose={() => setTransactionType('')}
                      size="sm"
                      aria-label={`Supprimer le filtre transaction: ${transactionType === 'achat' ? 'Achat' : 'Location'}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      {transactionType === 'achat' ? 'Achat' : 'Location'}
                    </Chip>
                  )}
                  {propertyTypes.map((propertyType) => (
                    <Chip
                      key={propertyType}
                      variant="flat"
                      onClose={() => handlePropertyTypeChange(propertyType, false)}
                      size="sm"
                      aria-label={`Supprimer le filtre type: ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase()}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      {propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase()}
                    </Chip>
                  ))}
                  {(priceRange[0] > 0 || priceRange[1] > 0) && (
                    <Chip
                      variant="flat"
                      onClose={() => setPriceRange([0, 0])}
                      size="sm"
                      aria-label={`Supprimer le filtre prix: ${displayRange(priceRange, `${CURRENCY}`)}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      Prix: {displayRange(priceRange, `${CURRENCY}`)}
                    </Chip>
                  )}
                  {(areaRange[0] > 0 || areaRange[1] > 0) && (
                    <Chip
                      variant="flat"
                      onClose={() => setAreaRange([0, 0])}
                      size="sm"
                      aria-label={`Supprimer le filtre surface: ${displayRange(areaRange, 'm²')}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      Surface: {displayRange(areaRange, 'm²')}
                    </Chip>
                  )}
                  {(landAreaRange[0] > 0 || landAreaRange[1] > 0) && (
                    <Chip
                      variant="flat"
                      onClose={() => setLandAreaRange([0, 0])}
                      size="sm"
                      aria-label={`Supprimer le filtre surface du terrain: ${displayRange(landAreaRange, 'm²')}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      Terrain: {displayRange(landAreaRange, 'm²')}
                    </Chip>
                  )}
                  {(roomsRange[0] > 0 || roomsRange[1] > 0) && (
                    <Chip
                      variant="flat"
                      onClose={() => setRoomsRange([0, 0])}
                      size="sm"
                      aria-label={`Supprimer le filtre pièces: ${displayRange(roomsRange, 'pièces')}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      {displayRange(roomsRange, 'pièces')}
                    </Chip>
                  )}
                  {(bedroomsRange[0] > 0 || bedroomsRange[1] > 0) && (
                    <Chip
                      variant="flat"
                      onClose={() => setBedroomsRange([0, 0])}
                      size="sm"
                      aria-label={`Supprimer le filtre chambres: ${displayRange(bedroomsRange, 'chambres')}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      {displayRange(bedroomsRange, 'chambres')}
                    </Chip>
                  )}
                  {proposedBy && (
                    <Chip
                      variant="flat"
                      onClose={() => setProposedBy('')}
                      size="sm"
                      aria-label={`Supprimer le filtre proposé par: ${proposedBy === 'particulier' ? 'Particulier' : 'Professionnel'}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      Proposé par: {proposedBy === 'particulier' ? 'Particulier' : 'Professionnel'}
                    </Chip>
                  )}
                  {availableAt && (
                    <Chip
                      variant="flat"
                      onClose={() => setAvailableAt('')}
                      size="sm"
                      aria-label={`Supprimer le filtre disponible à partir de: ${availableAt}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      Disponible: {new Date(availableAt).toLocaleDateString('fr-FR')}
                    </Chip>
                  )}
                  {features.map((feature) => (
                    <Chip
                      key={`feature-${feature}`}
                      variant="flat"
                      onClose={() => setFeatures((prev) => prev.filter((f) => f !== feature))}
                      size="sm"
                      aria-label={`Supprimer le filtre caractéristique: ${feature}`}
                      className="text-default-700 bg-content1 text-xs"
                    >
                      Caractéristique:{' '}
                      {amenities.find((amenity) => amenity.id === feature)?.name || feature}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <CardBody className="space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-6'
            }
          >
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                viewMode={viewMode}
                imagesDomain={imagesDomain}
              />
            ))}
          </div>
        ) : (
          <Card className="text-foreground border border-gray-200 bg-white py-12 text-center shadow-none">
            <CardBody>
              <div className="mb-4 flex flex-col justify-center text-gray-900">
                <Search className="mx-auto mb-4 h-16 w-16 text-emerald-300" />
                <h3 className="mb-2 text-xl font-semibold">Aucunne annonce trouvée</h3>
                <p>Essayez d'ajuster vos critères de recherche pour trouver plus de résultats.</p>
              </div>
              <div className="flex justify-center">
                <Button
                  onPress={clearAllFilters}
                  radius="full"
                  className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                >
                  Effacer tous les filtres
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Pagination */}
        {properties.length > 0 && total > limit && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <Pagination
              total={Math.ceil(total / limit)}
              page={page}
              onChange={setPage}
              showControls
              color="primary"
              size="lg"
            />
            <p className="text-default-500 text-sm">
              Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, total)} sur {total}{' '}
              biens
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
