import { NextResponse } from 'next/server';
import { getProperties } from '@/lib/actions/property';
import { CURRENCY } from '@/lib/config';

export async function GET() {
  const baseUrl = 'https://seloger-tchad.com';

  // Get all properties with images
  const { properties } = await getProperties({
    page: 1,
    limit: 1000,
  });

  // Generate image sitemap XML
  const imageEntries = properties
    .flatMap((property) => {
      if (!property.images || property.images.length === 0) return [];

      return property.images.map((image, index) => {
        const imageTypes = [
          'vue-principale',
          'salon',
          'cuisine',
          'chambre',
          'salle-de-bain',
          'exterieur',
        ];
        const imageType = imageTypes[index] || 'vue-interieure';

        return `
    <url>
      <loc>${baseUrl}/annonce/${property.id}</loc>
      <image:image>
        <image:loc>${image.url}</image:loc>
        <image:title>${property.title} - ${imageType}</image:title>
        <image:caption>${property.title} à ${property.location} - ${property.transactionType === 'achat' ? 'À vendre' : 'À louer'} ${property.price}${CURRENCY}</image:caption>
        <image:geo_location>${property.location}</image:geo_location>
        <image:license>https://seloger-tchad.com/license</image:license>
      </image:image>
    </url>`;
      });
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${imageEntries}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
