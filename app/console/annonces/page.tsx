export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import AdminPropertiesView from '@/components/console/admin-properties-view';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserTypeEnum } from '@/types/user';

export default async function AdminPropertiesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const user = session.user as any;
  if (user.userType !== UserTypeEnum.admin) {
    redirect('/');
  }

  const imagesDomain = process.env.NEXT_IMAGES_URL || '';

  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <AdminPropertiesView imagesDomain={imagesDomain} />
    </Suspense>
  );
}
