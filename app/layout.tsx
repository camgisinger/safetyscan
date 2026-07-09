import type { Metadata } from "next";
import { Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import "./styles/tokens.css";
import BottomNav from "../components/BottomNav";
import DesktopSidebar from "../components/DesktopSidebar";
import { UserProvider } from "../lib/UserContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL('https://sitespotter.com.au'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'en_AU', url: 'https://sitespotter.com.au', siteName: 'SiteSpotter',
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
    <html lang="en" data-theme="dark" className={`${geistMono.variable} ${geist.variable}`}>
      <body style={{ minHeight: '100svh', background: 'var(--bg)' }}>
        <UserProvider>
          <div style={{ display: 'flex', minHeight: '100svh' }}>
            <DesktopSidebar />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
          </div>
          <BottomNav />
        </UserProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
