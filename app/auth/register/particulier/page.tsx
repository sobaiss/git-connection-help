'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Phone, ArrowLeft, Eye, EyeOff, User } from 'lucide-react';
import { Button, Input, Card, CardBody, Checkbox, Divider, CardHeader } from '@heroui/react';
import { createUser } from '@/lib/actions/user';
import AutocompleteLocation from '@/components/ui/AutocompleteLocation';
import { getCachedLocations } from '@/lib/utils/location-cache';
import { Location } from '@/types/location';
import { UserTypeEnum } from '@/types/user';
import { getLocationHierarchy } from '@/lib/utils/location-filter';
import { addToast } from '@heroui/react';

export default function RegisterPage() {
  const emptyErrorMessages = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    password: '',
    confirmPassword: '',
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState(emptyErrorMessages);
  const router = useRouter();
  const [cityMap, setCityMap] = useState<Location[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    password: '',
    confirmPassword: '',
    agentLicense: '',
    acceptTerms: false,
    acceptMarketing: false,
    userType: UserTypeEnum.particulier,
  });

  useEffect(() => {
    (async () => {
      const locations = await getCachedLocations();
      const cities = locations.filter((location) => location.divisionLevel >= 3);
      setCityMap(cities);
    })();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessages(emptyErrorMessages);
  };

  const handleLocationInputChange = (field: string, value: string | boolean) => {
    console.log(`Field changed: ${field}, New value: ${value}`);
    setFormData((prev) => ({ ...prev, city: '', location: '' }));

    getLocationHierarchy(value as string).then((hierarchy) => {
      if (!hierarchy) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        city: hierarchy.city?.displayName || '',
        location: value as string,
      }));

      setErrorMessages(emptyErrorMessages);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');
    setErrorMessages(emptyErrorMessages);

    try {
      const response = await createUser(formData);

      if ('errors' in response) {
        console.log('Validation errors:', response.errors);

        const errors = { ...emptyErrorMessages };
        for (const [field, messages] of Object.entries(response.errors)) {
          if (Array.isArray(messages)) {
            errors[field as keyof typeof emptyErrorMessages] = messages[0];
          }
        }

        setErrorMessages(errors);
        setError(response.message ?? 'Erreur lors de la création du compte');
        return;
      }

      addToast({
        title: 'Compte créé avec succès!',
        description: 'Redirection vers la page de connexion...',
        color: 'success',
        timeout: 3000,
      });

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-blue-900 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Header Section */}

        <Card className="text-foreground border border-emerald-100 bg-white shadow-none">
          <CardBody className="space-y-8 p-8 md:p-12">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-emerald-700">Créer votre compte</h1>
              <p className="text-base text-gray-600">
                Rejoignez des milliers d'utilisateurs qui trouvent leur bien idéal
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-danger-600 bg-danger-50 border-danger-200 rounded-lg border p-4 text-base">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Input
                  size="lg"
                  type="email"
                  label="Adresse Email"
                  labelPlacement="outside"
                  placeholder="Entrez votre email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  startContent={<Mail className="text-default-400 h-4 w-4" />}
                  isRequired
                  isClearable
                  onClear={() => handleInputChange('email', '')}
                  errorMessage={errorMessages.email}
                  isInvalid={errorMessages.email !== ''}
                  className="w-full"
                  variant="bordered"
                />
              </div>

              <div className="space-y-2 pt-1">
                <Input
                  size="lg"
                  type="tel"
                  label="Numéro de téléphone"
                  labelPlacement="outside"
                  placeholder="Entrez votre numéro de téléphone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  startContent={<Phone className="text-default-400 h-4 w-4" />}
                  isRequired
                  isClearable
                  onClear={() => handleInputChange('phone', '')}
                  errorMessage={errorMessages.phone}
                  isInvalid={errorMessages.phone !== ''}
                  variant="bordered"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Input
                    size="lg"
                    label="Mot de passe"
                    labelPlacement="outside"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Créez un mot de passe"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    startContent={<Lock className="text-default-400 h-4 w-4" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 transition-colors hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                    isRequired
                    errorMessage={errorMessages.password}
                    isInvalid={errorMessages.password !== ''}
                    variant="bordered"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    size="lg"
                    label="Confirmer le mot de passe"
                    labelPlacement="outside"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    startContent={<Lock className="text-default-400 h-4 w-4" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 transition-colors hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                    isRequired
                    errorMessage={errorMessages.confirmPassword}
                    isInvalid={errorMessages.confirmPassword !== ''}
                    variant="bordered"
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Input
                    size="lg"
                    label="Prénom"
                    labelPlacement="outside"
                    placeholder="Entrez votre prénom"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    isClearable
                    onClear={() => handleInputChange('firstName', '')}
                    errorMessage={errorMessages.firstName}
                    variant="bordered"
                    isInvalid={errorMessages.firstName !== ''}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    size="lg"
                    label="Nom"
                    labelPlacement="outside"
                    placeholder="Entrez votre nom"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    isClearable
                    onClear={() => handleInputChange('lastName', '')}
                    errorMessage={errorMessages.lastName}
                    isInvalid={errorMessages.lastName !== ''}
                    variant="bordered"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <AutocompleteLocation
                  isRequired={false}
                  allowsCustomValue={false}
                  locations={cityMap}
                  selectedLocation={formData.location}
                  setSelectedLocation={(value) => handleLocationInputChange('location', value)}
                  label="Adresse"
                  labelPlacement="outside"
                  placeholder="Rechercher une ville, un quartier, un arrondissement..."
                  errorMessage={errorMessages.location}
                  isInvalid={errorMessages.location !== ''}
                />
              </div>
              <div className="space-y-2">
                <Input
                  label="Ville"
                  labelPlacement="outside"
                  isDisabled
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  size="lg"
                  radius="lg"
                  errorMessage={errorMessages.city}
                  isInvalid={errorMessages.city !== ''}
                  className="w-full"
                  variant="bordered"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-5 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    isSelected={formData.acceptTerms}
                    onValueChange={(checked) =>
                      handleInputChange('acceptTerms', checked as boolean)
                    }
                    isRequired
                  >
                    J'accepte les{' '}
                    <Link href="/terms" className="text-blue-900 hover:text-blue-800">
                      Conditions d'Utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/privacy" className="text-blue-900 hover:text-blue-800">
                      Politique de Confidentialité
                    </Link>
                  </Checkbox>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    isSelected={formData.acceptMarketing}
                    onValueChange={(checked) =>
                      handleInputChange('acceptMarketing', checked as boolean)
                    }
                  >
                    Je souhaite recevoir des communications marketing et des mises à jour de biens
                  </Checkbox>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  radius="full"
                  className="mt-4 border border-emerald-100 bg-emerald-600 text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                  isDisabled={isLoading || !formData.acceptTerms}
                  isLoading={isLoading}
                  startContent={<User className="h-6 w-6" />}
                >
                  {isLoading ? 'Création du Compte...' : 'Créer un compte'}
                </Button>
              </div>
            </form>

            <div className="relative">
              <Divider />
              <div className="text-default-500 absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-sm">ou</span>
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
                >
                  S'inscrire avec Google
                </Button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="text-base text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link href="/auth/signin" className="font-medium text-blue-900 hover:text-blue-800">
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
