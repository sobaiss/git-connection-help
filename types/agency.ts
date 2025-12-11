export enum AgencyStatusEnum {
  valide = 'valide',
  attente_validation = 'attente_validation',
  verifie = 'verifie',
  bloque = 'bloque',
  supprime = 'supprime',
}

export interface Agency {
  id: string;
  name: string;
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  status: AgencyStatusEnum;
  verifiedAt?: Date;
  validateAt?: Date;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  users?: User[];
  properties?: Property[];

  // Counts
  _count?: {
    users: number;
    properties: number;
  };
}

export interface CreateAgencyInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

export interface UpdateAgencyInput extends Partial<CreateAgencyInput> {}

import { User } from './user';
import { Property } from './property';
