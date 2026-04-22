import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const SITE_URL = "https://homegrownfb.fit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HomeGrown Fitness | Personal Trainer in Detroit & Metro-Detroit, MI — Fitbaee",
    template: "%s | HomeGrown Fitness Detroit",
  },
  description:
    "Fitbaee is an elite personal trainer serving Detroit and Metro-Detroit, Michigan. Specializing in personal training, virtual coaching, group KAMP sessions, nutrition planning, body sculpting, and athletic performance. Book your session today.",
  keywords: [
    "personal trainer Detroit",
    "personal trainer Metro-Detroit",
    "personal trainer Michigan",
    "fitness coach Detroit MI",
    "Detroit personal training",
    "Detroit gym coach",
    "Metro Detroit fitness trainer",
    "Fitbaee trainer",
    "HomeGrown Fitness Detroit",
    "weight loss coach Detroit",
    "body sculpting Detroit",
    "athletic performance training Detroit",
    "nutrition coach Detroit",
    "KAMP group fitness Detroit",
    "virtual personal trainer Michigan",
    "online fitness coach Detroit",
  ],
  authors: [{ name: "Fitbaee", url: SITE_URL }],
  creator: "Fitbaee",
  publisher: "HomeGrown Fitness",
  category: "health & fitness",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "HomeGrown Fitness",
    title: "HomeGrown Fitness | Personal Trainer in Detroit & Metro-Detroit, MI",
    description:
      "Elite personal training, nutrition coaching, group sessions, and body sculpting in Detroit & Metro-Detroit, Michigan. Fitbaee delivers results-driven coaching tailored to you.",
    images: [
      {
        url: "/public/Subject.png",
        width: 1200,
        height: 630,
        alt: "Fitbaee — Personal Trainer in Detroit Michigan | HomeGrown Fitness",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeGrown Fitness | Personal Trainer in Detroit, MI — Fitbaee",
    description:
      "Elite personal training in Detroit & Metro-Detroit, MI. One-on-one coaching, group KAMP sessions, nutrition, and body sculpting with Fitbaee.",
    images: ["/public/Subject.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    // Add your Google Search Console verification token here after setup
    // google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      name: "HomeGrown Fitness",
      description:
        "Elite personal training, group fitness, nutrition coaching, body sculpting, and athletic performance training in Detroit and Metro-Detroit, Michigan.",
      url: SITE_URL,
      email: "info@homegrown.fit",
      founder: {
        "@type": "Person",
        name: "Fitbaee",
        jobTitle: "Certified Personal Trainer",
        worksFor: { "@id": `${SITE_URL}/#business` },
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Detroit",
        addressRegion: "MI",
        addressCountry: "US",
      },
      areaServed: [
        { "@type": "City", name: "Detroit", "@id": "https://www.wikidata.org/wiki/Q12439" },
        { "@type": "AdministrativeArea", name: "Metro Detroit" },
        { "@type": "State", name: "Michigan" },
      ],
      geo: {
        "@type": "GeoCoordinates",
        latitude: 42.3314,
        longitude: -83.0458,
      },
      priceRange: "$$",
      currenciesAccepted: "USD",
      paymentAccepted: "Cash, Credit Card",
      sameAs: ["https://github.com/AnthonyRice3/HomeGrown"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Personal Training & Wellness Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Personal Training",
              description:
                "One-on-one customized workout sessions built around your fitness level, goals, and schedule.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Virtual Training",
              description:
                "Live video coaching with form correction and weekly program updates.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Group Session — KAMP",
              description:
                "High-energy group training in a motivating camp-style format for Detroit fitness enthusiasts.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Nutrition Coaching",
              description:
                "Customized meal plans and nutrition strategy to complement your training.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Body Sculpting",
              description:
                "Targeted programs to tone, define, and transform your physique.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Athletic Performance Training",
              description:
                "Sport-specific conditioning for speed, power, agility, and endurance.",
            },
          },
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "HomeGrown Fitness",
      description: "Personal Trainer in Detroit & Metro-Detroit, Michigan",
      publisher: { "@id": `${SITE_URL}/#business` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#f59e0b",
          colorBackground: "#09090b",
          colorText: "#ffffff",
          colorTextSecondary: "rgba(255,255,255,0.5)",
          colorInputBackground: "#18181b",
          colorInputText: "#ffffff",
          borderRadius: "12px",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="min-h-full bg-black text-white">
          <Script src="https://js.stripe.com/v3/" strategy="beforeInteractive" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
