import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/guide', '/shared/', '/privacy', '/terms', '/help'],
        disallow: ['/dashboard', '/scan/', '/sites/', '/ssinternal'],
      },
    ],
    sitemap: 'https://sitespotter.com.au/sitemap.xml',
  }
}
