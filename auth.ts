import NextAuth, { CredentialsSignin, User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { getUserProfile, login } from '@/lib/actions/user';
import { LoginSchema } from '@/lib/validations/user';
import { jwtDecode } from 'jwt-decode';
import { JWT } from '@auth/core/jwt';

// Helper function to refresh the access token using the refresh token
async function refreshToken(token: JWT): Promise<JWT | null> {
  try {
    // Make a request to your API to refresh the token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.refreshToken}`,
      },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });

    // console.log('Refresh token response:', response);
    if (!response.ok) {
      // Refresh failed, return null to force sign out
      return null;
    }

    const data = await response.json();

    // Update token with new access and refresh tokens
    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || token.refreshToken, // Use existing refresh token if not provided
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null; // Return null to force sign out on error
  }
}

async function getUserFromProviderAccount(account: any): Promise<User | null> {
  if (account.provider !== 'google' || !account.access_token) {
    console.error('Unsupported provider or missing access token');
    return null;
  }

  try {
    console.log('Getting user from provider account:', account);
  // Make a request to your API to refresh the token
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': `${account.access_token}`,
    },
  });

  // console.log('Refresh token response:', response);
  if (!response.ok) {
    console.error('Failed to get user from provider account');
    // Refresh failed, return null to force sign out
    return null;
  }

  const {user, access_token, refresh_token} = await response.json();

  console.log('User data from provider account:', { user, access_token, refresh_token });
  
  if (!user || !access_token || !refresh_token) {
    console.error('No user data returned from provider account');
    return null;
  }

  // Update token with new access and refresh tokens
  return {
    ...user,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
} catch (error) {
  console.error('Error refreshing token:', error);
  return null; // Return null to force sign out on error
}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          type: 'email',
          label: 'Email',
        },
        password: {
          type: 'password',
          label: 'Password',
        },
      },
      authorize: async (credentials) => {
        let user: User | null = null;

        const { email, password } = await LoginSchema.parseAsync(credentials);

        const response = await login(email, password);
        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        if (!data.access_token) {
          throw new CredentialsSignin('Email ou mot de passe incorrect.');
        }

        user = await getUserProfile(data.access_token);

        if (!user) {
          // No user found, so this is their first attempt to login
          // Optionally, this is also the place you could do a user registration
          throw new CredentialsSignin('Email ou mot de passe incorrect.');
        }

        user.accessToken = data.access_token;
        user.refreshToken = data.refresh_token;

        // console.log('------ authorize', { user });

        // return user object with their profile data
        return user;
      },
    }),
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, account, profile }) {
      // console.log('********* jwt callback token:', token);
      // console.log('********* jwt callback account:', account);
      // console.log('********* jwt callback profile:', profile);
      // console.log('********* jwt callback user:', user);

      // Handle session update trigger
      if (trigger === 'update' && session?.user) {
        token.accessToken = session.accessToken;
        token.refreshToken = session.refreshToken;
        token.user = session.user as any;
        // return {
        //   ...token,
        //   user: {
        //     ...token.user,
        //     ...session.user,
        //   },
        //   accessToken: token.accessToken,
        //   refreshToken: token.refreshToken,
        // };
      } else if (user && account?.provider === 'credentials') {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = user as any;
      } else if (user && account?.provider === 'google') {
        const data = await getUserFromProviderAccount(account);
        if (data) {
          user = data;
          token.accessToken = data.accessToken;
          token.refreshToken = data.refreshToken;
          token.user = data as any;
        }
      }

      if (token?.accessToken) {
        // console.log('++++++++ token accessToken:', token.accessToken);
        const decodedToken = jwtDecode(token.accessToken);
        // console.log('++++++++ decoded token:', decodedToken);
        if (decodedToken?.exp) {
          token.accessTokenExpires = decodedToken.exp * 1000; // Convert to milliseconds
        }
      }

      if (Date.now() < (token.accessTokenExpires || 0)) {
        // If the access token is still valid, return the token as is
        return token;
      }

      return refreshToken(token);

      // return {
      //   ...token,
      //   user: user || token.user,
      //   accessToken: user ? (user as any).accessToken : token.accessToken,
      //   refreshToken user ? (user as any).refreshToken : token.refreshToken,
      // };
    },
    session({ session, token }) {
      // console.log('------ session callback', session, token );
      if (token) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.user = token.user as any;
      }

      return session;
      // return {
      //   ...session,
      //   user: {
      //     ...token.user,
      //   },
      //   accessToken: token.accessToken,
      //   refreshToken: token.refreshToken,
      // };
    },
    async signIn({ account, profile }) {
      // console.log('+++++ signIn callback account:', account);
      // console.log('+++++ signIn callback profile:', profile);
      if (account?.provider === 'google') {
        return !!(profile?.email_verified)
      }
      return true // Do different verification for other providers that don't have `email_verified`
    },
  },
  secret: process.env.AUTH_SECRET,
});
