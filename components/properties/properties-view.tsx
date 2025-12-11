'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Grid2X2, List } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Slider,
  Card,
  CardBody,
  CardHeader,
  ButtonGroup,
} from '@heroui/react';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types/property';
import { getProperties } from '@/lib/actions/property';
import { useSearchParams } from 'next/navigation';

export default function PropertiesView({ imagesDomain }: { imagesDomain: string }) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    searchParams.get('propertyTypes')?.split(',') || []
  );
  const [transactionType, setTransactionType] = useState(
    searchParams.get('transactionType') || 'all'
  );
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [sortBy, setSortBy] = useState('price-asc');
  const [viewMode, setViewMode] = useState('grid');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProperties, setTotalProperties] = useState(0);

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const filters = {
          location: searchQuery !== '' ? searchQuery : undefined,
          propertyTypes: propertyTypes.length > 0 ? propertyTypes.join(',') : undefined,
          transactionType: transactionType !== 'all' ? transactionType : undefined,
        };

        const response = await getProperties({ filters });

        setProperties(response?.properties || []);
        setTotalProperties(response?.pagination.total || 0);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchQuery, propertyTypes, transactionType, priceRange, sortBy]);

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters */}
          <div className="text-foreground space-y-6 lg:w-80">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  <h3 className="text-lg font-semibold">Search Filters</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-6 pt-0">
                <div className="space-y-2">
                  <label className="text-default-700 block text-sm font-medium">Localisation</label>
                  <Input
                    placeholder="Rechercher une localisation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startContent={<MapPin className="text-default-400 h-4 w-4" />}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-default-700 block text-sm font-medium">
                    Type de Transaction
                  </label>
                  <Select
                    selectedKeys={transactionType ? [transactionType] : []}
                    onSelectionChange={(keys) =>
                      setTransactionType((Array.from(keys)[0] as string) || '')
                    }
                    placeholder="Tous types"
                  >
                    <SelectItem key="all">Tous types</SelectItem>
                    <SelectItem key="achat">Acheter</SelectItem>
                    <SelectItem key="location">Louer</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-default-700 block text-sm font-medium">Type de Bien</label>
                  <Select
                    selectedKeys={propertyTypes}
                    onSelectionChange={(keys) => setPropertyTypes(Array.from(keys) as string[])}
                    placeholder="Tous les biens"
                  >
                    <SelectItem key="all">Tous les biens</SelectItem>
                    <SelectItem key="appartement">Appartement</SelectItem>
                    <SelectItem key="maison">Maison</SelectItem>
                    <SelectItem key="villa">Villa</SelectItem>
                    <SelectItem key="terrain">Terrain</SelectItem>
                    <SelectItem key="bureau_commerce">Bureau/Commerce</SelectItem>
                  </Select>
                </div>

                <div className="space-y-4">
                  <label className="text-default-700 block text-sm font-medium">
                    Fourchette de Prix
                  </label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onChange={(value) => setPriceRange(Array.isArray(value) ? value : [value])}
                      maxValue={1000000}
                      minValue={0}
                      step={10000}
                      className="w-full"
                      formatOptions={{ style: 'currency', currency: 'EUR' }}
                    />
                  </div>
                  <div className="text-default-600 flex justify-between text-sm">
                    <span>€{priceRange[0].toLocaleString()}</span>
                    <span>€{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with view controls */}
            <div className="bg-content1 border-content4 mb-6 rounded-lg border p-4">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-default-900 text-2xl font-bold">Biens ({totalProperties})</h1>
                  <p className="text-default-600">Trouvez votre bien idéal</p>
                </div>

                <div className="flex items-center gap-4">
                  <Select
                    selectedKeys={[sortBy]}
                    onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                    className="w-48"
                  >
                    <SelectItem key="price-asc">Prix: Croissant</SelectItem>
                    <SelectItem key="price-desc">Prix: Décroissant</SelectItem>
                    <SelectItem key="area-desc">Surface: Plus Grande</SelectItem>
                  </Select>

                  <ButtonGroup>
                    <Button
                      variant={viewMode === 'grid' ? 'solid' : 'bordered'}
                      size="sm"
                      onPress={() => setViewMode('grid')}
                      isIconOnly
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'solid' : 'bordered'}
                      size="sm"
                      onPress={() => setViewMode('list')}
                      isIconOnly
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </div>

            {/* Properties Grid/List */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg bg-white shadow-md">
                    <div className="aspect-[4/3] rounded-t-lg bg-gray-200"></div>
                    <div className="space-y-3 p-6">
                      <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                      <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                      <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
                    : 'space-y-6'
                }
              >
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} imagesDomain={imagesDomain} />
                ))}
              </div>
            ) : (
              <Card className="py-12 text-center">
                <CardBody>
                  <div className="mb-4 text-gray-500">
                    <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="mb-2 text-xl font-semibold">Aucune annonce trouvée</h3>
                    <p>
                      Essayez d'ajuster vos critères de recherche pour trouver plus de résultats.
                    </p>
                  </div>
                  <Button
                    onPress={() => {
                      setSearchQuery('');
                      setPropertyTypes(['all']);
                      setTransactionType('all');
                      setPriceRange([0, 1000000]);
                    }}
                  >
                    Effacer tous les filtres
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
