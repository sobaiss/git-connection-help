'use client';

import { Location } from '@/types/location';
import { Search } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AutocompleteLocation from '../ui/AutocompleteLocation';
import SelectTransaction from '../ui/SelectTransaction';
import SelectPropertyType from '../ui/SelectPropertyType';

export default function HomeSearchBarHome({ locations }: { locations: Location[] }) {
  const { replace } = useRouter();

  const [searchLocation, setSearchLocation] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    if (searchLocation) {
      params.set('location', searchLocation);
    } else {
      params.delete('location');
    }

    if (propertyTypes.length > 0) {
      params.set('propertyTypes', propertyTypes.join(','));
    } else {
      params.delete('propertyTypes');
    }

    if (transactionType) {
      params.set('transactionType', transactionType);
    } else {
      params.delete('transactionType');
    }

    replace(`/rechercher?${params.toString()}`);
  };

  return (
    <div>
      <Card className="mx-auto max-w-5xl bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardBody className="text-foreground p-6">
          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <AutocompleteLocation
                locations={locations}
                selectedLocation={searchLocation}
                setSelectedLocation={setSearchLocation}
                label="Localisation"
                placeholder="Ville, quartier..."
              />
            </div>

            <div className="lg:col-span-3">
              <SelectTransaction
                label="Transaction"
                placeholder="Type"
                transactionType={transactionType}
                setTransactionType={setTransactionType}
              />
            </div>

            <div className="lg:col-span-3">
              <SelectPropertyType
                label="Type de bien"
                placeholder="Maison, villa..."
                propertyTypes={propertyTypes}
                setPropertyTypes={setPropertyTypes}
              />
            </div>

            <div className="lg:col-span-1">
              <Button
                size="lg"
                color="primary"
                className="h-14 w-full border border-emerald-100 bg-emerald-600 font-semibold text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                radius="full"
                onPress={handleSearch}
                isIconOnly
              >
                <Search className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
