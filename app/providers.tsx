'use client';

import { SessionProvider } from 'next-auth/react';
import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/toast';
import { StrictMode } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StrictMode>
      <SessionProvider>
        <HeroUIProvider>
          <ToastProvider placement="top-right" />
          {children}
        </HeroUIProvider>
      </SessionProvider>
    </StrictMode>
  );
}
