import { MapPin } from 'lucide-react';
import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { Location } from '@/types/location';

export default function AutocompleteLocation({
  locations,
  selectedLocation,
  setSelectedLocation: setSearchQuery,
  label,
  labelPlacement,
  placeholder,
  allowsCustomValue,
  isRequired,
  errorMessage,
  isInvalid,
}: {
  label?: string;
  labelPlacement?: 'inside' | 'outside' | 'outside-left' | 'outside-top';
  placeholder?: string;
  locations: Location[];
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  allowsCustomValue?: boolean;
  isRequired?: boolean;
  errorMessage?: string;
  isInvalid?: boolean;
}) {
  //Get unique locations by displayName
  const uniqueLocations = Array.from(
    new Map(locations.map((loc) => [loc.displayName, loc])).values()
  );

  return (
    <Autocomplete
      isRequired={isRequired || false}
      label={label}
      labelPlacement={labelPlacement || 'inside'}
      placeholder={placeholder}
      allowsCustomValue
      onSelectionChange={(key) => setSearchQuery(key as string)}
      className="flex-1"
      defaultItems={uniqueLocations}
      defaultSelectedKey={selectedLocation}
      startContent={<MapPin className="text-default-400 h-5 w-5" />}
      variant="bordered"
      radius="full"
      size="lg"
      isClearable
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      aria-label="Rechercher une localisation"
    >
      {(locationItem) => (
        <AutocompleteItem
          key={locationItem.displayName}
          endContent={`(${locationItem.divisionName})`}
        >
          {locationItem.displayName}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
