'use client';

import Link from 'next/link';
import { User, Building, ArrowLeft, Check, Star } from 'lucide-react';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-blue-900 transition-colors hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">Rejoignez SeLoger-Tchad</h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Choisissez le type de compte qui correspond à vos besoins et commencez à publier vos
              annonces immobilières
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Particulier Card */}
          <Card className="group relative transform overflow-hidden border-0 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
            <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>

            <CardHeader className="flex flex-row items-center justify-center gap-4 pt-12 pb-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 transition-all group-hover:shadow-lg">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-secondary-600 text-3xl font-bold text-gray-900">Particulier</h2>
            </CardHeader>

            <CardBody className="px-8 pt-0 pb-10">
              <div className="mb-8 text-center">
                <p className="font-bold">
                  Vendez ou louez votre bien immobilier en toute simplicité
                </p>
              </div>
              <div className="mb-10 space-y-5">
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Publication d'annonces gratuite</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Gestion simple de vos biens</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Contact direct avec les acheteurs</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Outils de promotion intégrés</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Star className="mr-4 h-6 w-6 flex-shrink-0 text-yellow-500" />
                  <span className="text-lg">Badge "Compte Vérifié"</span>
                </div>
              </div>

              <div className="mb-8 text-center">
                <Chip color="secondary" variant="flat" size="md">
                  Recommandé pour les propriétaires
                </Chip>
              </div>

              <Link href="/auth/register/particulier" className="block">
                <Button
                  color="secondary"
                  size="lg"
                  className="text-secondary-900 bg-secondary-100 border-secondary-600 hover:border-secondary hover:bg-secondary hover:text-background h-14 w-full border"
                  startContent={<User className="h-6 w-6" />}
                  radius="full"
                >
                  Créer un compte particulier
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Agence Card */}
          <Card className="group relative transform overflow-hidden border-0 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
            <div className="from-warning-500 to-warning-600 absolute top-0 left-0 h-2 w-full bg-gradient-to-r"></div>

            <CardHeader className="flex flex-row items-center justify-center gap-4 pt-12 pb-6">
              <div className="from-warning-100 to-warning-50 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br transition-all group-hover:shadow-lg">
                <Building className="text-warning-600 h-8 w-8" />
              </div>
              <h2 className="text-warning-600 text-3xl font-bold text-gray-900">
                Agence Immobilière
              </h2>
            </CardHeader>

            <CardBody className="px-8 pt-0 pb-10">
              <div className="mb-8 text-center">
                <p className="font-bold">Solution professionnelle pour les agences immobilières</p>
              </div>
              <div className="mb-10 space-y-5">
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Annonces illimitées</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Gestion multi-utilisateurs</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Outils de gestion avancés</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="mr-4 h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-lg">Statistiques détaillées</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Star className="mr-4 h-6 w-6 flex-shrink-0 text-yellow-500" />
                  <span className="text-lg">Badge "Professionnel Vérifié"</span>
                </div>
              </div>

              <div className="mb-8 text-center">
                <Chip color="warning" variant="flat" size="md">
                  Pour les professionnels
                </Chip>
              </div>

              <Link href="/auth/register/agence" className="block">
                <Button
                  color="warning"
                  size="lg"
                  radius="full"
                  className="text-warning-900 bg-warning-100 border-warning-600 hover:border-warning hover:bg-warning hover:text-background h-14 w-full border"
                  startContent={<Building className="h-6 w-6" />}
                >
                  Créer un compte agence
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        {/* Sign In Link */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-900 transition-colors hover:text-blue-800"
            >
              Connectez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
