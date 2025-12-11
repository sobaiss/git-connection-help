import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-12 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/logo-seloger-tchad.svg" alt="seloger-tchad" className="h-10 w-10" />
              <span className="text-xl font-bold">seloger-tchad</span>
            </div>
            <p className="leading-relaxed text-gray-400">
              Votre partenaire de confiance pour l'immobilier au Tchad. Bientôt disponible pour vous
              servir.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-bold">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="h-5 w-5" />
                <span>N'Djamena, Tchad</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="h-5 w-5" />
                <span>+235 66 84 84 84</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="h-5 w-5" />
                <span>contact@seloger-tchad.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-bold">Suivez-nous</h4>
            <p className="mb-4 text-gray-400">
              Restez connecté pour les dernières mises à jour et actualités immobilières.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 transition-colors hover:bg-emerald-700"
              >
                <span className="text-lg">f</span>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 transition-colors hover:bg-emerald-700"
              >
                <span className="text-lg">in</span>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 transition-colors hover:bg-emerald-700"
              >
                <span className="text-lg">ig</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2025 seloger-tchad. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
