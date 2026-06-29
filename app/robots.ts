import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/guide', '/shared/', '/privacy', '/terms'],
        disallow: ['/dashboard', '/scan/', '/sites/', '/ssinternal'],
      },
    ],
    sitemap: 'https://safetyscan.com.au/sitemap.xml',
  }
}
