import { Button, Card, CardBody } from '@heroui/react';
import { Home, Link, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="overflow-hidden bg-white shadow-lg">
        <CardBody className="p-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">Annonce introuvable</h1>
            <p className="mb-8 text-lg text-gray-600">
              Désolé, l'annonce que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/rechercher">
                <Button
                  color="primary"
                  size="lg"
                  radius="full"
                  className="text-primary-900 bg-primary-100 border-primary-600 hover:border-primary hover:bg-primary border"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Rechercher un bien
                </Button>
              </Link>
              <Link href="/">
                <Button variant="bordered" size="lg" radius="full" className="px-8">
                  <Home className="mr-2 h-5 w-5" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
