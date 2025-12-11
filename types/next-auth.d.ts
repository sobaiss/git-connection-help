import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';
import { Agency } from '@/types/agency';
import { Right, UserSavedSearch, UserSettings, UserStatusEnum, UserTypeEnum } from '@/types/user';
import { PropertyFavorite } from '@/types/property';

interface DbUser extends DefaultUser {
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserTypeEnum;
  status: UserStatusEnum;
  acceptMarketing: boolean;
  agency?: Agency;
  agencyId?: string;
  createdAt: Date;
  lockedAt?: Date;
  updatedAt?: Date;
  validatedAt?: Date;
  verifiedAt?: Date;
  isMainContact?: boolean;
  settings?: UserSettings;
  favoriteProperties?: PropertyFavorite[];
  savedSearches?: UserSavedSearch[];
  rights?: Right[];
  accessToken?: string;
  refreshToken?: string;
}

declare module 'next-auth' {
  interface User extends DbUser {}

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: DbUser & DefaultSession['user'];
  }

  interface User extends DbUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    user: DbUser;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // in milliseconds
  }
}
