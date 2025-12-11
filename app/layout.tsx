import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { inter } from './fonts';

export const metadata: Metadata = {
  title: 'SeLoger-Tchad - Trouvez Votre Bien Idéal',
  description: 'Découvrez des milliers de biens immobiliers partout au Tchad.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const imagesDomain = process.env.NEXT_IMAGES_URL || '';
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Header imagesDomain={imagesDomain} />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
