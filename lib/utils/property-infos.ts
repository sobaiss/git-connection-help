import { RateTypeEnum } from '@/types/property';
import { propertyTypesConfig } from '../config';

export const formatPropertyType = (propertyType: string, transactionType: string) => {
  let label =
    propertyTypesConfig.find((type) => type.value === propertyType)?.label ?? propertyType;
  label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  return transactionType === 'location' ? `${label} en location` : `${label} en vente`;
};

export const formatPrice = (price: number | null | undefined, rate: RateTypeEnum): string => {
  if (price === null || price === undefined) return 'Prix non spécifié';

  const value = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
  }).format(price);

  return rate && rate !== RateTypeEnum.unique ? `${value} / ${rate}` : value;
};
