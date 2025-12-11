'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterProfessionnelPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the agency registration page
    router.replace('/auth/register/agence');
  }, [router]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="border-primary-500 mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-default-600">Redirection vers l'inscription agence...</p>
      </div>
    </div>
  );
}
