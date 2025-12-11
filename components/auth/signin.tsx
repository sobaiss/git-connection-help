'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, LogInIcon, User2Icon } from 'lucide-react';
import { Button, Input, Card, CardBody, Checkbox, Divider } from '@heroui/react';
import { callSignIn } from '@/lib/actions/auth';
import { LoginSchema } from '@/lib/validations/user';
import { useSession } from 'next-auth/react';

export default function SignInView() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setIsRedirecting(true);
      router.push('/');
    }
  }, [session, router]);

  if (isRedirecting) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Redirection...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await LoginSchema.safeParseAsync({ email, password });
    if (!result.success) {
      setError('Email ou mot de passe incorrect');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await callSignIn(email, password, false, '/');

      console.log('SignIn result:', result);

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      // Update the session to reflect the new login state
      await update();

      // Force a router refresh to update server components
      router.refresh();

      // Redirect to home page
      router.push('/');
    } catch (error: unknown) {
      console.error('SignIn error:', error);
      const errorName = (error as Error).name;
      if (errorName === 'CredentialsSignin') {
        setError('Email ou mot de passe incorrect');
        return;
      }

      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-900 transition-colors hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            <span className="font-medium">Retour à l'accueil</span>
          </Link>
        </div>

        <div className="pt-1 pb-3 text-center">
          <p className="text-base text-gray-600">
            Pas encore de compte ?{' '}
            <Button
              radius="full"
              color="primary"
              size="sm"
              className="text-primary-900 border-default-600 hover:border-default-200 hover:bg-default-200 border bg-white font-semibold"
              startContent={<User2Icon className="h-4 w-4" />}
            >
              <Link href="/auth/register">Créer un compte</Link>
            </Button>
          </p>
        </div>

        <Card className="border border-emerald-100 bg-white shadow-none">
          <CardBody className="space-y-8 px-8 pb-10">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-emerald-700">Connexion</h1>
              <p className="text-base text-gray-600">
                Accédez à votre compte pour gérer vos biens et recherches
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                  <p className="mt-2 text-xs text-gray-900">
                    Si vous êtes une agence, votre compte est peut être en attente de validation.
                    Veuillez valider votre compte en consultant votre email. Contacter le support
                    client pour débloquer votre compte si le problème persiste.
                  </p>
                </div>
              )}

              <Input
                type="email"
                variant="bordered"
                label="Adresse email"
                labelPlacement="outside"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startContent={<Mail className="h-5 w-5 text-gray-400" />}
                size="lg"
                className="w-full pt-3"
                isRequired
                aria-label="Email Address"
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                labelPlacement="outside"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startContent={<Lock className="h-5 w-5 text-gray-400" />}
                size="lg"
                variant="bordered"
                className="w-full pt-4"
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                isRequired
                aria-label="Password"
              />

              <div className="pt-2">
                <Checkbox
                  isSelected={rememberMe}
                  onValueChange={setRememberMe}
                  size="md"
                  classNames={{
                    label: 'text-base',
                  }}
                  aria-label="Remember Me"
                >
                  Se souvenir de moi
                </Checkbox>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  radius="full"
                  className="mt-4 border border-emerald-100 bg-emerald-600 text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                  isLoading={isLoading}
                  aria-label="Sign In"
                >
                  <LogInIcon className="mr-2 h-5 w-5" />
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  color="primary"
                  size="lg"
                  radius="full"
                  className="text-primary-900 hover:bg-primary hover:text-background mt-4 bg-white"
                  isLoading={isLoading}
                  aria-label="Sign In"
                  as={Link}
                  href="/auth/forgot-password"
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </form>

            <div className="relative py-4">
              <Divider />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-base text-gray-500">ou</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Button
                  variant="bordered"
                  size="lg"
                  radius="full"
                  className="border border-gray-300 text-base font-medium hover:bg-gray-50"
                  onPress={() => signIn('google', { callbackUrl: '/' })}
                  isDisabled={isLoading}
                  startContent={
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  }
                  aria-label="Sign in with Google"
                >
                  {isLoading ? 'Connexion...' : 'Continuer avec Google'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
