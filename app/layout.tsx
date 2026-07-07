import type { Metadata } from "next";
import { Schibsted_Grotesk, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import "./styles/tokens.css";
import FloatingActionButton from "../components/FloatingActionButton";
import BottomNav from "../components/BottomNav";
import { SpeedInsights } from "@vercel/speed-insights/next";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: 'SiteSpotter — Queensland Construction Compliance',
    template: '%s | SiteSpotter',
  },
  description: 'AI-powered Queensland construction compliance checks. Upload a site photo and instantly identify WHS compliance issues, applicable legislation, and generate site checklists.',
  keywords: ['Queensland construction compliance', 'WHS compliance', 'construction safety', 'scaffolding compliance Queensland', 'SiteSpotter', 'site compliance check', 'AS 1742', 'WHS Act 2011 Queensland'],
  authors: [{ name: 'Mono Compliance' }],
  creator: 'Mono Compliance',
  publisher: 'Mono Compliance',
  metadataBase: new URL('https://safetyscan.com.au'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'en_AU', url: 'https://safetyscan.com.au', siteName: 'SiteSpotter',
    title: 'SiteSpotter — Queensland Construction Compliance',
    description: 'AI-powered Queensland construction compliance checks.',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'SiteSpotter' }],
  },
  twitter: { card: 'summary_large_image', title: 'SiteSpotter', description: 'AI-powered Queensland construction compliance checks.', images: ['/brand/og-image.png'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: [
      { url: '/brand/mark-ink.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/brand/mark-amber-on-ink.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/brand/mark-ink.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={`${schibsted.variable} ${geistMono.variable} ${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <BottomNav />
        <FloatingActionButton />
        <SpeedInsights />
      </body>
    </html>
  );
}
