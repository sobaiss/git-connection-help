'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  ArrowLeft,
  Building,
  Globe,
  MapPin,
  User,
  ArrowRight,
  Building2,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardBody,
  Checkbox,
  Textarea,
  Progress,
  addToast,
} from '@heroui/react';
import { createAgency } from '@/lib/actions/agency';
import { createAgencySchema } from '@/lib/validations/agency';
import { z } from 'zod';
import { UserTypeEnum } from '@/types/user';
import AutocompleteLocation from '@/components/ui/AutocompleteLocation';
import { Location } from '@/types/location';
import { getCachedLocations } from '@/lib/utils/location-cache';
import { getLocationHierarchy } from '@/lib/utils/location-filter';

export default function RegisterAgencyPage() {
  const emptyErrorMessages = {
    // Agency errors
    agency: {
      name: '',
      description: '',
      address: '',
      location: '',
      city: '',
      zipCode: '',
      phone: '',
      email: '',
      website: '',
    },
    // User errors
    user: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      location: '',
      city: '',
    },
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState(emptyErrorMessages);
  const [cityMap, setCityMap] = useState<Location[]>([]);
  const router = useRouter();

  const [agencyData, setAgencyData] = useState({
    name: '',
    description: '',
    address: '',
    location: '',
    city: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
  });

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
    userType: UserTypeEnum.professionnel,
    location: '',
    city: '',
  });

  useEffect(() => {
    (async () => {
      const locations = await getCachedLocations();
      const cities = locations.filter((location) => location.divisionLevel >= 3);
      setCityMap(cities);
    })();
  }, []);

  const handleAgencyInputChange = (field: string, value: string) => {
    setAgencyData((prev) => ({ ...prev, [field]: value }));
    setErrorMessages(emptyErrorMessages);
  };

  const handleUserInputChange = (field: string, value: string | boolean) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
    setErrorMessages(emptyErrorMessages);
  };

  const handleLocationInputChange = (field: string, value: string | boolean) => {
    setAgencyData((prev) => ({ ...prev, city: '', location: '' }));

    getLocationHierarchy(value as string).then((hierarchy) => {
      if (!hierarchy) {
        return;
      }

      setAgencyData((prev) => ({
        ...prev,
        location: value as string,
        city: hierarchy.city?.displayName || '',
        zipCode: hierarchy.selected?.zip || '',
      }));

      setUserData((prev) => ({
        ...prev,
        location: value as string,
        city: hierarchy.city?.displayName || '',
      }));

      setErrorMessages(emptyErrorMessages);
    });
  };

  const nextStep = () => {
    // Validate agency data before moving to step 2
    if (currentStep === 1) {
      const validatedFields = createAgencySchema.safeParse(agencyData);
      console.log('Agency validation result:', validatedFields.success);

      if (!validatedFields.success) {
        console.log('Agency validation errors:', z.flattenError(validatedFields.error).fieldErrors);

        const errors = { ...emptyErrorMessages };
        for (const [field, messages] of Object.entries(
          z.flattenError(validatedFields.error).fieldErrors
        )) {
          if (Array.isArray(messages)) {
            errors.agency[field as keyof typeof emptyErrorMessages.agency] = messages[0];
          }
        }

        setErrorMessages(errors);

        setError('Veuillez corriger les erreurs ci-dessous.');

        return;
      }
    }

    setCurrentStep(2);
    setError('');
  };

  const prevStep = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      nextStep();
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorMessages(emptyErrorMessages);

    try {
      // First create the agency
      const agencyResponse = await createAgency({ agency: agencyData, user: userData });

      if ('errors' in agencyResponse) {
        console.log('Agency creation errors:', agencyResponse.errors);

        const errors = { ...emptyErrorMessages };
        for (const [field, messages] of Object.entries(agencyResponse.errors.agency || {})) {
          if (Array.isArray(messages)) {
            errors.agency[field as keyof typeof emptyErrorMessages.agency] = messages[0];
          }
        }

        for (const [field, messages] of Object.entries(agencyResponse.errors.user || {})) {
          if (Array.isArray(messages)) {
            errors.user[field as keyof typeof emptyErrorMessages.user] = messages[0];
          }
        }

        setErrorMessages(errors);
        setError(agencyResponse.message);
        return;
      }

      addToast({
        title: 'Agence et compte créés avec succès!',
        description:
          'Votre compte est en attente de validation par un administrateur. Redirection vers la page de connexion...',
        color: 'success',
        timeout: 5000,
      });

      setTimeout(() => {
        router.push('/auth/signin');
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-8">
          <div className="pb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-none">
              <Building className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-emerald-700">Informations de l'Agence</h2>
            <p className="mx-auto max-w-md text-lg text-gray-700">
              Créez le profil de votre agence immobilière et rejoignez notre réseau de
              professionnels
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Input
                size="lg"
                label="Nom"
                labelPlacement="outside"
                placeholder="Nom de votre agence"
                value={agencyData.name}
                onChange={(e) => handleAgencyInputChange('name', e.target.value)}
                startContent={<Building className="text-default-400 h-4 w-4" />}
                isRequired
                isClearable
                onClear={() => handleAgencyInputChange('name', '')}
                errorMessage={errorMessages.agency.name}
                isInvalid={errorMessages.agency.name !== ''}
                aria-label="Nom de l'agence"
                variant="bordered"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Input
                  size="lg"
                  type="tel"
                  label="Téléphone"
                  labelPlacement="outside"
                  placeholder="Téléphone de l'agence"
                  value={agencyData.phone}
                  onChange={(e) => handleAgencyInputChange('phone', e.target.value)}
                  startContent={<Phone className="text-default-400 h-4 w-4" />}
                  isRequired
                  isClearable
                  onClear={() => handleAgencyInputChange('phone', '')}
                  errorMessage={errorMessages.agency.phone}
                  isInvalid={errorMessages.agency.phone !== ''}
                  aria-label="Téléphone de l'agence"
                  variant="bordered"
                />
              </div>
              <div className="space-y-2">
                <Input
                  size="lg"
                  type="email"
                  label="Email"
                  labelPlacement="outside"
                  placeholder="Email de l'agence"
                  value={agencyData.email}
                  onChange={(e) => handleAgencyInputChange('email', e.target.value)}
                  startContent={<Mail className="text-default-400 h-4 w-4" />}
                  isRequired
                  isClearable
                  onClear={() => handleAgencyInputChange('email', '')}
                  errorMessage={errorMessages.agency.email}
                  isInvalid={errorMessages.agency.email !== ''}
                  aria-label="Email de l'agence"
                  variant="bordered"
                />
              </div>
            </div>
            <div className="space-y-2">
              <AutocompleteLocation
                isRequired={true}
                labelPlacement="outside"
                allowsCustomValue={false}
                locations={cityMap}
                selectedLocation={agencyData.location}
                setSelectedLocation={(value) => handleLocationInputChange('location', value)}
                label="Localisation"
                placeholder="Rechercher une ville, un quartier, un arrondissement..."
                errorMessage={errorMessages.agency.location}
                isInvalid={errorMessages.agency.location !== ''}
                aria-label="Localisation de l'agence"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                size="lg"
                label="Description"
                labelPlacement="outside"
                placeholder="Décrivez votre agence, vos services, votre expertise..."
                value={agencyData.description}
                onChange={(e) => handleAgencyInputChange('description', e.target.value)}
                minRows={3}
                errorMessage={errorMessages.agency.description}
                isInvalid={errorMessages.agency.description !== ''}
                aria-label="Description de l'agence"
                variant="bordered"
              />
            </div>
            <div className="space-y-2 pt-2">
              <Input
                size="lg"
                label="Adresse"
                labelPlacement="outside"
                placeholder="Adresse complète de l'agence"
                value={agencyData.address}
                onChange={(e) => handleAgencyInputChange('address', e.target.value)}
                startContent={<MapPin className="text-default-400 h-4 w-4" />}
                isClearable
                onClear={() => handleAgencyInputChange('address', '')}
                errorMessage={errorMessages.agency.address}
                isInvalid={errorMessages.agency.address !== ''}
                aria-label="Adresse de l'agence"
                variant="bordered"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Input
                  size="lg"
                  isDisabled
                  label="Ville"
                  labelPlacement="outside"
                  placeholder="Ville"
                  value={agencyData.city}
                  onChange={(e) => handleAgencyInputChange('city', e.target.value)}
                  errorMessage={errorMessages.agency.city}
                  isInvalid={errorMessages.agency.city !== ''}
                  aria-label="Ville de l'agence"
                  variant="bordered"
                />
              </div>
              <div className="space-y-2">
                <Input
                  size="lg"
                  isDisabled
                  label="Code postal"
                  labelPlacement="outside"
                  placeholder="Code postal"
                  value={agencyData.zipCode}
                  onChange={(e) => handleAgencyInputChange('zipCode', e.target.value)}
                  errorMessage={errorMessages.agency.zipCode}
                  isInvalid={errorMessages.agency.zipCode !== ''}
                  aria-label="Code postal de l'agence"
                  variant="bordered"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Input
                size="lg"
                type="url"
                label="Site web"
                labelPlacement="outside"
                placeholder="https://www.votre-agence.com"
                value={agencyData.website}
                onChange={(e) => handleAgencyInputChange('website', e.target.value)}
                startContent={<Globe className="text-default-400 h-4 w-4" />}
                isClearable
                onClear={() => handleAgencyInputChange('website', '')}
                errorMessage={errorMessages.agency.website}
                isInvalid={errorMessages.agency.website !== ''}
                aria-label="Site web de l'agence"
                variant="bordered"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-none">
            <User className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-emerald-700">Votre compte principal</h2>
          <p className="mx-auto max-w-md text-lg text-gray-700">
            Créez votre compte personnel pour gérer l'agence et ses annonces
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                size="lg"
                label="Prénom"
                labelPlacement="outside"
                placeholder="Votre prénom"
                value={userData.firstName}
                onChange={(e) => handleUserInputChange('firstName', e.target.value)}
                isRequired
                isClearable
                onClear={() => handleUserInputChange('firstName', '')}
                errorMessage={errorMessages.user.firstName}
                isInvalid={errorMessages.user.firstName !== ''}
                aria-label="Prénom"
                variant="bordered"
              />
            </div>
            <div className="space-y-2">
              <Input
                size="lg"
                label="Nom"
                labelPlacement="outside"
                placeholder="Votre nom"
                value={userData.lastName}
                onChange={(e) => handleUserInputChange('lastName', e.target.value)}
                isRequired
                isClearable
                onClear={() => handleUserInputChange('lastName', '')}
                errorMessage={errorMessages.user.lastName}
                isInvalid={errorMessages.user.lastName !== ''}
                aria-label="Nom"
                variant="bordered"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Input
              size="lg"
              type="email"
              label="Email"
              labelPlacement="outside"
              placeholder="Votre adresse email"
              value={userData.email}
              onChange={(e) => handleUserInputChange('email', e.target.value)}
              startContent={<Mail className="text-default-400 h-4 w-4" />}
              isRequired
              isClearable
              onClear={() => handleUserInputChange('email', '')}
              errorMessage={errorMessages.user.email}
              isInvalid={errorMessages.user.email !== ''}
              aria-label="Adresse email"
              variant="bordered"
            />
          </div>

          <div className="space-y-2 pt-2">
            <Input
              size="lg"
              type="tel"
              label="Téléphone"
              labelPlacement="outside"
              placeholder="Votre numéro de téléphone"
              value={userData.phone}
              onChange={(e) => handleUserInputChange('phone', e.target.value)}
              startContent={<Phone className="text-default-400 h-4 w-4" />}
              isRequired
              isClearable
              onClear={() => handleUserInputChange('phone', '')}
              errorMessage={errorMessages.user.phone}
              isInvalid={errorMessages.user.phone !== ''}
              aria-label="Numéro de téléphone"
              variant="bordered"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                size="lg"
                label="Mot de passe"
                labelPlacement="outside"
                type={showPassword ? 'text' : 'password'}
                placeholder="Créez un mot de passe"
                value={userData.password}
                onChange={(e) => handleUserInputChange('password', e.target.value)}
                startContent={<Lock className="text-default-400 h-4 w-4" />}
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
                errorMessage={errorMessages.user.password}
                isInvalid={errorMessages.user.password !== ''}
                aria-label="Mot de passe"
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
                value={userData.confirmPassword}
                onChange={(e) => handleUserInputChange('confirmPassword', e.target.value)}
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
                errorMessage={errorMessages.user.confirmPassword}
                isInvalid={errorMessages.user.confirmPassword !== ''}
                aria-label="Confirmer le mot de passe"
                variant="bordered"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                isSelected={userData.acceptTerms}
                onValueChange={(checked) =>
                  handleUserInputChange('acceptTerms', checked as boolean)
                }
                isRequired
                size="lg"
                aria-label="Conditions d'Utilisation"
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
                isSelected={userData.acceptMarketing}
                onValueChange={(checked) =>
                  handleUserInputChange('acceptMarketing', checked as boolean)
                }
                size="lg"
                aria-label="Communications marketing"
              >
                Je souhaite recevoir des communications marketing et des mises à jour
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/auth/register"
            className="mb-4 inline-flex items-center text-blue-900 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au choix du type de compte
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold text-emerald-700">
            Créer votre agence immobilière
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-700">
            Rejoignez notre plateforme en tant que professionnel
          </p>
        </div>

        {/* Progress Bar - Outside Card */}
        <div className="mb-8">
          <div className="mx-auto max-w-md">
            <Progress
              value={(currentStep / 2) * 100}
              className="mb-4 w-full"
              color="primary"
              size="lg"
              radius="full"
              aria-label="Progression de l'inscription"
            />
            <div className="flex justify-between text-sm font-medium">
              <div
                className={`flex items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-default-400'}`}
              >
                <div
                  className={`mr-2 flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep >= 1
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-default-100 text-default-400'
                  }`}
                >
                  1
                </div>
                Agence
              </div>
              <div
                className={`flex items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-default-400'}`}
              >
                <div
                  className={`mr-2 flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep >= 2
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-default-100 text-default-400'
                  }`}
                >
                  2
                </div>
                Administrateur
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="text-foreground border border-emerald-100 bg-white shadow-none">
          <CardBody className="space-y-8 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-danger-600 bg-danger-50 border-danger-200 rounded-lg border p-4 text-sm">
                  {error}
                </div>
              )}

              {renderStepContent()}

              <div className="flex flex-col justify-center gap-3 pt-8 sm:flex-row sm:justify-between">
                {currentStep > 1 && (
                  <Button
                    variant="bordered"
                    onPress={prevStep}
                    isDisabled={isLoading}
                    size="lg"
                    radius="full"
                    color="warning"
                    aria-label="Bouton Précédent"
                    startContent={<ArrowLeft className="mr-2 h-5 w-5" />}
                    className="text-default-900 bg-default-100 border-default-600 hover:border-default hover:bg-default-200 order-1 border px-8 py-3 sm:order-1"
                  >
                    Précédent
                  </Button>
                )}
                <Button
                  type="submit"
                  color="warning"
                  size="lg"
                  radius="full"
                  className={`order-2 border border-emerald-100 bg-emerald-600 text-white hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 sm:order-2 ${currentStep === 1 ? 'sm:mx-auto' : ''}`}
                  isDisabled={
                    isLoading ||
                    (currentStep === 1 &&
                      (!agencyData.name || !agencyData.email || !agencyData.phone)) ||
                    (currentStep === 2 &&
                      (!userData.acceptTerms ||
                        !userData.firstName ||
                        !userData.lastName ||
                        !userData.email ||
                        !userData.phone ||
                        !userData.password ||
                        !userData.confirmPassword))
                  }
                  isLoading={isLoading}
                  aria-label="Bouton Suivant ou Soumettre"
                  startContent={
                    currentStep === 1 ? (
                      <ArrowRight className="mr-2 h-5 w-5" />
                    ) : (
                      <Building2 className="mr-2 h-5 w-5" />
                    )
                  }
                >
                  {isLoading
                    ? 'Création en cours...'
                    : currentStep === 1
                      ? 'Suivant'
                      : "Créer l'agence et le compte"}
                </Button>
              </div>
            </form>

            <div className="pt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link href="/auth/signin" className="font-medium text-blue-900 hover:text-blue-800">
                  Connectez-vous
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
