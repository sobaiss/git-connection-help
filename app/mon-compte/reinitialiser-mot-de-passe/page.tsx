'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { resetPassword } from '@/lib/actions/user';

const emptyErrorMessages = {
  password: '',
  confirmPassword: '',
};

function ResetPasswordForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState(emptyErrorMessages);

  // Redirect to signin if user is logged in
  useEffect(() => {
    if (status === 'loading') return;
    if (session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Check if token is present
  useEffect(() => {
    if (status === 'loading') return;
    if (!session && !token) {
      router.push('/auth/signin');
    }
  }, [token, session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setErrorMessages(emptyErrorMessages);

    if (!token) {
      setError('Token manquant. Veuillez réessayer depuis votre email.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await resetPassword({
        token,
        password,
        confirmPassword,
      });

      if ('errors' in response) {
        const errors = { ...emptyErrorMessages };
        for (const [field, messages] of Object.entries(response.errors)) {
          if (Array.isArray(messages)) {
            errors[field as keyof typeof emptyErrorMessages] = messages[0];
          }
        }

        setErrorMessages(errors);
        setError(response.message || 'Erreur lors de la réinitialisation du mot de passe');
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show nothing while checking authentication or if token is missing
  if (status === 'loading') {
    return null;
  }

  // Don't render if user is logged in (will redirect)
  if (session) {
    return null;
  }

  // Don't render if token is missing (will redirect)
  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center text-blue-900 transition-colors hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            <span className="font-medium">Retour à la connexion</span>
          </Link>
        </div>

        <Card className="text-foreground border border-gray-200 bg-white shadow-xl">
          <CardBody className="px-8 pb-10">
            <div className="space-y-3 pt-10 pb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {isSubmitted ? 'Mot de passe réinitialisé' : 'Nouveau mot de passe'}
              </h1>
              <p className="text-lg text-gray-600">
                {isSubmitted
                  ? 'Votre mot de passe a été réinitialisé avec succès'
                  : 'Entrez votre nouveau mot de passe'}
              </p>
            </div>
            {isSubmitted ? (
              <div className="space-y-6 text-center">
                <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
                <div className="space-y-3">
                  <p className="text-base text-gray-600">
                    Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <Button
                    color="primary"
                    size="lg"
                    className="text-base font-semibold"
                    radius="full"
                    startContent={<LogIn className="h-5 w-5" />}
                  >
                    <Link href="/auth/signin">Se connecter</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <div className="pt-5 pb-5">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Nouveau Mot de Passe"
                    labelPlacement="outside"
                    placeholder="Entrez votre nouveau mot de passe"
                    value={password}
                    onChange={(e) => {
                      setErrorMessages((prev) => ({
                        ...prev,
                        password: '',
                      }));
                      setPassword(e.target.value);
                    }}
                    startContent={<Lock className="h-5 w-5 text-gray-400" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    }
                    size="lg"
                    classNames={{
                      input: 'text-base',
                      label: 'text-base font-medium',
                    }}
                    isRequired
                    errorMessage={errorMessages.password}
                    isInvalid={errorMessages.password !== ''}
                  />
                </div>

                <div className="pb-3">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirmer le Mot de Passe"
                    labelPlacement="outside"
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => {
                      setErrorMessages((prev) => ({
                        ...prev,
                        confirmPassword: '',
                      }));
                      setConfirmPassword(e.target.value);
                    }}
                    startContent={<Lock className="h-5 w-5 text-gray-400" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    }
                    size="lg"
                    classNames={{
                      input: 'text-base',
                      label: 'text-base font-medium',
                    }}
                    isRequired
                    errorMessage={errorMessages.confirmPassword}
                    isInvalid={errorMessages.confirmPassword !== ''}
                  />
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    Le mot de passe doit contenir au moins 8 caractères, une majuscule, une
                    minuscule et un chiffre.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    radius="full"
                    className="mt-4 text-base font-semibold"
                    isDisabled={isLoading}
                    isLoading={isLoading}
                  >
                    {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                  </Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" />}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
