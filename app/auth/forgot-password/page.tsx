'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { forgotPassword } from '@/lib/actions/user';

export default function ForgotPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (status === 'loading') return;
    if (session) {
      router.push('/');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await forgotPassword({ email });

      if ('errors' in response) {
        setError(response.message || "Erreur lors de l'envoi de l'email de réinitialisation");
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

  // Show nothing while checking authentication
  if (status === 'loading') {
    return null;
  }

  // Don't render if user is logged in (will redirect)
  if (session) {
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

        <Card className="border border-emerald-100 bg-white shadow-none">
          <CardBody className="px-8 pb-10">
            <div className="space-y-3 pt-10 pb-10 text-center">
              <h1 className="pb-4 text-3xl font-bold text-emerald-700">
                {isSubmitted ? 'Vérifiez votre email' : 'Réinitialiser votre mot de passe'}
              </h1>
              <p className="text-base text-gray-600">
                {isSubmitted
                  ? 'Nous avons envoyé un lien de réinitialisation à votre adresse email'
                  : 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe'}
              </p>
            </div>
            {isSubmitted ? (
              <div className="space-y-6 text-center">
                <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
                <div className="space-y-3 text-center">
                  <p className="text-center text-base text-gray-600">
                    Nous avons envoyé un lien de réinitialisation à :
                  </p>
                  <p className="text-lg font-semibold text-gray-900">{email}</p>
                </div>
                <div className="space-y-4 pt-4">
                  <p className="text-base text-gray-600">
                    Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou réessayez.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="bordered"
                      size="lg"
                      onPress={() => {
                        setIsSubmitted(false);
                        setError('');
                        setEmail('');
                      }}
                      className="mt-4 border border-gray-600 bg-transparent text-emerald-900 hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                      radius="full"
                    >
                      Essayer un autre email
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      color="primary"
                      size="lg"
                      className="mt-4 border border-emerald-100 bg-emerald-600 text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                      radius="full"
                      startContent={<LogIn className="h-5 w-5" />}
                    >
                      <Link href="/auth/signin">Retour à la connexion</Link>
                    </Button>
                  </div>
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

                <Input
                  type="email"
                  label="Adresse Email"
                  labelPlacement="outside"
                  placeholder="Entrez votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={<Mail className="h-5 w-5 text-gray-400" />}
                  size="lg"
                  isRequired
                />

                <div className="mt-4 text-center">
                  <Button
                    type="submit"
                    color="primary"
                    radius="full"
                    size="lg"
                    isDisabled={isLoading}
                    isLoading={isLoading}
                    startContent={<Mail className="h-5 w-5" />}
                    className="mt-4 border border-emerald-100 bg-emerald-600 text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                  >
                    {isLoading ? 'Envoi...' : 'Envoyer le lien'}
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
