import {
  PropertyStatusEnum,
  PropertyTransactionTypeEnum,
  PropertyTypeEnum,
} from '@/types/property';
import { UserTypeEnum } from '@/types/user';
import {
  WashingMachine,
  Warehouse,
  Flame,
  ChefHat,
  Maximize2,
  ArrowUpDown,
  Pickaxe,
  Archive,
  Frame,
  Building,
  Mountain,
  TreePine,
  Car,
  Waves,
  Building2,
  Landmark,
  MapPin,
  Droplet,
  Zap,
  Umbrella,
  GraduationCap,
  Volume2,
  Dumbbell,
  Eye,
  type LucideIcon,
  UserIcon,
  SortAscIcon,
  SortDescIcon,
  Briefcase,
  ImageIcon,
  Home,
} from 'lucide-react';

export const transactionsConfig = [
  { value: PropertyTransactionTypeEnum.achat, label: 'Achat' } as const,
  { value: PropertyTransactionTypeEnum.location, label: 'Location' } as const,
] as const;

export const allPropertyTransactionTypes = Object.values(PropertyTransactionTypeEnum);

export const propertyTypesIconMap: Record<PropertyTypeEnum, LucideIcon> = {
  [PropertyTypeEnum.appartement]: Building,
  [PropertyTypeEnum.bureau_commerce]: Briefcase,
  [PropertyTypeEnum.immeuble]: Building2,
  [PropertyTypeEnum.maison]: Home,
  [PropertyTypeEnum.terrain]: MapPin,
  [PropertyTypeEnum.terrain_agricole]: ImageIcon,
  [PropertyTypeEnum.villa]: Building2,
};

export const propertyTypesConfig = [
  {
    value: PropertyTypeEnum.maison,
    label: 'Maison',
    icon: propertyTypesIconMap[PropertyTypeEnum.maison],
  } as const,
  {
    value: PropertyTypeEnum.villa,
    label: 'Villa',
    icon: propertyTypesIconMap[PropertyTypeEnum.villa],
  } as const,
  {
    value: PropertyTypeEnum.appartement,
    label: 'Appartement',
    icon: propertyTypesIconMap[PropertyTypeEnum.appartement],
  } as const,
  {
    value: PropertyTypeEnum.terrain,
    label: 'Terrain',
    icon: propertyTypesIconMap[PropertyTypeEnum.terrain],
  } as const,
  {
    value: PropertyTypeEnum.terrain_agricole,
    label: 'Terrain agricole',
    icon: propertyTypesIconMap[PropertyTypeEnum.terrain_agricole],
  } as const,
  {
    value: PropertyTypeEnum.bureau_commerce,
    label: 'Bureaux & Commerces',
    icon: propertyTypesIconMap[PropertyTypeEnum.bureau_commerce],
  } as const,
  {
    value: PropertyTypeEnum.immeuble,
    label: 'Immeuble',
    icon: propertyTypesIconMap[PropertyTypeEnum.immeuble],
  } as const,
] as const;

export const allPropertyStatuses = Object.values(PropertyStatusEnum);

export const ownerTypesConfig = [
  { value: UserTypeEnum.particulier, label: 'Particulier' } as const,
  { value: UserTypeEnum.professionnel, label: 'Professionnel' } as const,
];

export const rateTypesConfig = [
  { value: 'heure', label: 'Par heure' },
  { value: 'jour', label: 'Par jour' },
  { value: 'semaine', label: 'Par semaine' },
  { value: 'mois', label: 'Par mois' },
  { value: 'trimestre', label: 'Par trimestre' },
  { value: 'semestre', label: 'Par semestre' },
  { value: 'an', label: 'Par an' },
  { value: 'unique', label: 'Prix unique' },
];

export const amenitiesConfig: Record<string, string> = {
  equipement: 'Équipements, Services, Commodités',
  exterieur: 'Extérieur',
  interieur: 'Intérieur',
};

export const propertyStatusesConfig = [
  {
    value: PropertyStatusEnum.attente_validation,
    label: 'Attente de validation',
    color: 'warning',
  } as const,
  { value: PropertyStatusEnum.brouillon, label: 'Brouillon', color: 'white' } as const,
  { value: PropertyStatusEnum.desactive, label: 'Désactivé', color: 'warning' } as const,
  { value: PropertyStatusEnum.disponible, label: 'Disponible', color: 'primary-600' } as const,
  { value: PropertyStatusEnum.loue, label: 'Loué', color: 'secondary' } as const,
  { value: PropertyStatusEnum.refuse, label: 'Refusé', color: 'danger' } as const,
  { value: PropertyStatusEnum.supprime, label: 'Supprimé', color: 'danger' } as const,
  { value: PropertyStatusEnum.vendu, label: 'Vendu', color: 'secondary' } as const,
];

export enum SortOrderEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export enum PropertySortFieldEnum {
  PERTINENCE = 'pertinence',
  PRICE = 'price',
  AREA = 'area',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PUBLISHED_AT = 'publishedAt',
  ROOMS = 'rooms',
}

export const sortOptionsConfig = [
  {
    value: 'pertinence',
    label: 'Pertinence',
    field: PropertySortFieldEnum.PERTINENCE,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'createdAt_asc',
    label: 'Les plus anciennes',
    field: PropertySortFieldEnum.CREATED_AT,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'createdAt_desc',
    label: 'Les plus récentes',
    field: PropertySortFieldEnum.CREATED_AT,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'updatedAt_desc',
    label: 'Mise à jour récente',
    field: PropertySortFieldEnum.UPDATED_AT,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'price_asc',
    label: 'Prix croissant',
    field: PropertySortFieldEnum.PRICE,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'price_desc',
    label: 'Prix décroissant',
    field: PropertySortFieldEnum.PRICE,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'rooms_asc',
    label: 'Nb pièces croissantes',
    field: PropertySortFieldEnum.ROOMS,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'rooms_desc',
    label: 'Nb pièces décroissantes',
    field: PropertySortFieldEnum.ROOMS,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'area_asc',
    label: 'Surface croissante',
    field: PropertySortFieldEnum.AREA,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'area_desc',
    label: 'Surface décroissante',
    field: PropertySortFieldEnum.AREA,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
];


export const sortOptionsSearchConfig = [
  {
    value: 'pertinence',
    label: 'Pertinence',
    field: PropertySortFieldEnum.PERTINENCE,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'publishedAt_asc',
    label: 'Les plus anciennes',
    field: PropertySortFieldEnum.PUBLISHED_AT,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'publishedAt_desc',
    label: 'Les plus récentes',
    field: PropertySortFieldEnum.PUBLISHED_AT,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'price_asc',
    label: 'Prix croissant',
    field: PropertySortFieldEnum.PRICE,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'price_desc',
    label: 'Prix décroissant',
    field: PropertySortFieldEnum.PRICE,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'rooms_asc',
    label: 'Nb pièces croissantes',
    field: PropertySortFieldEnum.ROOMS,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'rooms_desc',
    label: 'Nb pièces décroissantes',
    field: PropertySortFieldEnum.ROOMS,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
  {
    value: 'area_asc',
    label: 'Surface croissante',
    field: PropertySortFieldEnum.AREA,
    order: SortOrderEnum.ASC,
    icon: SortAscIcon,
  },
  {
    value: 'area_desc',
    label: 'Surface décroissante',
    field: PropertySortFieldEnum.AREA,
    order: SortOrderEnum.DESC,
    icon: SortDescIcon,
  },
];

export const amenitiesIconMap: Record<string, LucideIcon> = {
  buanderie: WashingMachine,
  cave: Warehouse,
  cheminée: Flame,
  cheminee: Flame,
  'cuisine equipée': ChefHat,
  'cuisine équipée': ChefHat,
  'grandes fenêtres': Maximize2,
  'grandes fenetres': Maximize2,
  'hauts plafonds': ArrowUpDown,
  'murs pierre': Pickaxe,
  'poutres apparentes': Frame,
  'poutres bois': Frame,
  rangements: Archive,
  'sols marbre': Frame,
  ascenseur: Building,
  balcon: Building,
  concierge: UserIcon,
  cour: Mountain,
  garage: Car,
  jardin: TreePine,
  parking: Car,
  piscine: Waves,
  'style industriel': Building2,
  terrasse: Mountain,
  'caractère historique': Landmark,
  'caractere historique': Landmark,
  'centre ville': MapPin,
  "forage d'eau": Droplet,
  'panneau solaire': Zap,
  'proche plage': Umbrella,
  'proche écoles': GraduationCap,
  'proche ecoles': GraduationCap,
  'quartier calme': Volume2,
  'salle de sport': Dumbbell,
  'vue mer': Eye,
};

export const ITEMS_PER_PAGE = 6;
export const CONSOLE_ITEMS_PER_PAGE = 10;

export const CURRENCY = 'FCFA';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_COUNT = 4;
