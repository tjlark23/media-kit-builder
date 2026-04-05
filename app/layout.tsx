import "./globals.css";

export const metadata = {
  title: "Media Kit Builder | Local Media HQ",
  description: "Create professional media kits for your newsletter brands. Build, customize, and share polished sponsor-ready media kits in minutes.",
  alternates: {
    canonical: "https://mediakit.localmediahq.com/",
  },
  openGraph: {
    title: "Media Kit Builder | Local Media HQ",
    description: "Create professional media kits for your newsletter brands. Build, customize, and share polished sponsor-ready media kits in minutes.",
    url: "https://mediakit.localmediahq.com/",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Media Kit Builder | Local Media HQ",
    description: "Create professional media kits for your newsletter brands. Build, customize, and share polished sponsor-ready media kits in minutes.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Media Kit Builder",
              "url": "https://mediakit.localmediahq.com/",
              "description": "Create professional media kits for your newsletter brands. Build, customize, and share polished sponsor-ready media kits in minutes.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
