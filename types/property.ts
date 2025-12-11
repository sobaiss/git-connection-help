import { Agency } from '@/types/agency';
import { User } from '@/types/user';

export enum PropertyStatusEnum {
  brouillon = 'brouillon',
  desactive = 'desactive',
  disponible = 'disponible',
  loue = 'loue',
  vendu = 'vendu',
  attente_validation = 'attente_validation',
  refuse = 'refuse',
  supprime = 'supprime',
}

export const PropertyEditableStatuses = [
  PropertyStatusEnum.brouillon,
  PropertyStatusEnum.desactive,
  PropertyStatusEnum.refuse,
  PropertyStatusEnum.disponible,
  PropertyStatusEnum.loue,
  PropertyStatusEnum.vendu,
];

export const PropertyDisactivableStatuses = [
  PropertyStatusEnum.disponible,
  // PropertyStatusEnum.attente_validation,
];

export const PropertyDeleteableStatuses = [
  PropertyStatusEnum.brouillon,
  PropertyStatusEnum.desactive,
  PropertyStatusEnum.loue,
  PropertyStatusEnum.vendu,
  PropertyStatusEnum.refuse,
];

export enum PropertyTransactionTypeEnum {
  achat = 'achat',
  location = 'location',
}
export enum PropertyAmenityCategoryEnum {
  equipement = 'equipement',
  exterieur = 'exterieur',
  interieur = 'interieur',
}

export enum OwnerTypeEnum {
  particulier = 'particulier',
  professionnel = 'professionnel',
}
export enum RateTypeEnum {
  an = 'an',
  heure = 'heure',
  jour = 'jour',
  mois = 'mois',
  semaine = 'semaine',
  semestre = 'semestre',
  trimestre = 'trimestre',
  unique = 'unique',
}

export enum PropertyTypeEnum {
  appartement = 'appartement',
  bureau_commerce = 'bureau_commerce',
  immeuble = 'immeuble',
  maison = 'maison',
  terrain = 'terrain',
  terrain_agricole = 'terrain_agricole',
  villa = 'villa',
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  rate?: RateTypeEnum;
  location: string;
  address?: string;
  zipCode?: string;
  city?: string;
  borough?: string;
  neighborhood?: string;
  propertyType: PropertyTypeEnum;
  transactionType: PropertyTransactionTypeEnum;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  landArea?: number;
  floor?: number;
  totalFloors?: number;
  featured?: boolean;
  yearBuilt?: number;
  availableAt?: Date;
  publishedAt?: string;
  reference?: string;
  agencyReference?: string;
  views?: number;
  status: PropertyStatusEnum;
  createdAt: Date;
  updatedAt?: Date;
  ownerId: string;
  owner?: User;
  agencyId?: string;
  useUserContact?: boolean;
  versionTag: 'main' | 'draft';
  nextVersionId?: string;
  agency?: Agency;
  images?: PropertyImage[];
  amenities?: PropertyAmenity[];
  favorites?: PropertyFavorite[];
  contact?: PropertyContact;
  nextVersion?: Property;
  currentVersion?: Property;

  _count?: {
    favorites: number;
  };
}
export interface Amenity {
  id: string;
  name: string;
  category: PropertyAmenityCategoryEnum;
  createdAt?: Date;
  updatedAt?: Date;
  properties?: PropertyAmenity[];
}

export interface PropertyAmenity {
  id: string;
  area?: number;
  amenityCount?: number;
  createdAt: Date;
  propertyId: string;
  property?: Property;
  amenityId: string;
  amenity?: Amenity;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
  createdAt: Date;
  propertyId?: string;
  property?: Property;
}

export interface PropertyFavorite {
  id: string;
  createdAt: Date;
  userId: string;
  user?: User;
  propertyId: string;
  property?: Property;
}

export type PaginatedProperty = {
  properties: Property[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
};

export type PropertyContact = {
  id: string;
  phone?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  propertyId: string;
  property?: Property;
};
