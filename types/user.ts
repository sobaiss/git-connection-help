export enum UserTypeEnum {
  particulier = 'particulier',
  professionnel = 'professionnel',
  interne = 'interne',
  admin = 'admin',
}

export enum UserStatusEnum {
  attente_validation = 'attente_validation',
  valide = 'valide',
  verifie = 'verifie',
  bloque = 'bloque',
  supprime = 'supprime',
  attente_suppression = 'attente_suppression',
}

export interface UserSettings {
  id: string;
  acceptEmailContact: boolean;
  acceptPhoneContact: boolean;
  displayEmail: boolean;
  displayPhone: boolean;
  createdAt: Date;
  updatedAt?: Date;
  userId: string;
}
export interface UserSavedSearch {
  id: string;
  name: string;
  filters: {
    location?: string;
    propertyTypes?: string[];
    transactionType?: string;
    priceRange?: [number, number];
    areaRange?: [number, number];
    bedrooms?: string;
  };
  createdAt: Date;
  alertsEnabled: boolean;
}

export interface Right {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRight {
  id: string;
  userId: string;
  rightId: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
  location?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserTypeEnum;
  status: UserStatusEnum;
  validatedAt?: Date;
  verifiedAt?: Date;
  acceptMarketing: boolean;
  agencyId?: string;
  createdAt?: Date;
  lockedAt?: Date;
  updatedAt?: Date;
  isMainContact?: boolean;
  settings?: UserSettings;
  savedSearches?: UserSavedSearch[];
  rights?: Right[];
  accessToken?: string;
}
