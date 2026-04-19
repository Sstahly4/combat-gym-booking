import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { ConditionalFooter } from "@/components/conditional-footer"
import { CurrencyProvider } from "@/lib/contexts/currency-context"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://combatbooking.com"
).replace(/\/$/, "")

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CombatBooking.com",
  url: siteUrl,
  logo: `${siteUrl}/favicon-512x512-rounded.png`,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Combat Gym Booking",
  description: "Book authentic combat sports training camps",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Combat Gym Booking",
    description: "Book authentic combat sports training camps",
    url: "/",
    siteName: "CombatBooking.com",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/favicon-512x512-rounded.png",
        width: 512,
        height: 512,
        alt: "CombatBooking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Combat Gym Booking",
    description: "Book authentic combat sports training camps",
    images: ["/favicon-512x512-rounded.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <CurrencyProvider>
          <Navbar />
          <main className="flex min-h-0 flex-1 flex-col">
            {children}
          </main>
          <ConditionalFooter />
        </CurrencyProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
