'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
import { verifyEmail, verifyEmailChange } from '@/lib/actions/user';
import { signOut, useSession } from 'next-auth/react';

function VerifyEmailContent({
  action,
}: {
  action: 'verifier-email' | 'verifier-changement-email';
}) {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [pageStatus, setPageStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token')?.toString() || '';

    if (!token || token.trim() === '') {
      setPageStatus('error');
      setMessage('Aucun token de vérification fourni.');
      return;
    }

    const verifyUserEmail = async () => {
      try {
        let response: any | undefined = undefined;
        switch (action) {
          case 'verifier-email':
            response = await verifyEmail(token);
            break;
          case 'verifier-changement-email':
            response = await verifyEmailChange(token);
            break;
          default:
            setPageStatus('error');
            setMessage('Action de vérification invalide.');
            return;
        }

        if (response && 'errors' in response) {
          setPageStatus('error');
          setMessage(response.message || 'Une erreur est survenue lors de la vérification.');
        } else {
          setPageStatus('success');
          setMessage('Votre compte a été vérifié avec succès !');

          if (action === 'verifier-changement-email') {
            setTimeout(() => {
              signOut({ callbackUrl: '/auth/signin', redirect: false });
            }, 3000);
          }
        }
      } catch (error) {
        setPageStatus('error');
        setMessage('Une erreur est survenue. Veuillez réessayer plus tard.');
      }
    };

    verifyUserEmail();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
      <Card className="text-foreground border border-gray-200 bg-white shadow-xl">
        <CardBody className="gap-6 p-8 text-center">
          {pageStatus === 'loading' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vérification en cours...</h1>
                <p className="mt-2 text-gray-600">
                  Nous vérifions votre adresse e-mail. Veuillez patienter.
                </p>
              </div>
            </>
          )}

          {pageStatus === 'success' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vérification réussie !</h1>
                <p className="mt-2 text-gray-600">{message}</p>
                <p className="mt-4 text-sm text-gray-500">
                  Vous pouvez maintenant vous connecter à votre compte et profiter de toutes les
                  fonctionnalités.
                </p>
              </div>
              {status !== 'authenticated' && (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/signin" className="w-full">
                    <Button
                      color="primary"
                      size="lg"
                      className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                      radius="full"
                    >
                      Se connecter
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}

          {pageStatus === 'error' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vérification échouée</h1>
                <p className="mt-2 text-gray-600">{message}</p>
                <p className="mt-4 text-sm text-gray-500">
                  Le lien de vérification peut être expiré ou invalide. Veuillez contacter le
                  support si le problème persiste.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/auth/signin" className="w-full">
                  <Button
                    color="primary"
                    size="lg"
                    className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                    radius="full"
                  >
                    Se connecter
                  </Button>
                </Link>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                <span>Besoin d'aide ? Contactez-nous</span>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function VerifierEmailView({
  action = 'verifier-email',
}: {
  action: 'verifier-email' | 'verifier-changement-email';
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
          <Card className="w-full max-w-md">
            <CardBody className="gap-6 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Chargement...</h1>
            </CardBody>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent action={action} />
    </Suspense>
  );
}
