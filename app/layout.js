import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// AEO/SEO Defaults
export const metadata = {
  metadataBase: new URL('https://news.studiohappens.tech'),
  title: {
    template: "%s | PR & News",
    default: "Latest PR & News | Premium Agency",
  },
  description: "Stay up to date with our top press releases, modern insights, and news. Powered by AI for Answer Engine Optimization.",
  openGraph: {
    title: "Latest PR & News | Premium Agency",
    description: "Stay up to date with our top press releases, modern insights, and news.",
    url: "https://news.studiohappens.tech",
    siteName: "PR & News Agency",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest PR & News | Premium Agency",
    description: "Stay up to date with our top press releases, modern insights, and news.",
  },
};

export default function RootLayout({ children }) {
  // Injecting an Organization JSON-LD script for rich search engine results
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Premium PR Agency",
    "url": "https://news.studiohappens.tech",
    "logo": "https://news.studiohappens.tech/logo.png"
  };

  return (
    <html lang="en">
      <body>
        <header className="main-header">
          <div className="container main-nav">
            <h2 style={{ fontFamily: "var(--heading-font)", margin: 0 }}>
              <a href="/">PR<span style={{ color: "var(--accent)" }}>News</span></a>
            </h2>
            <nav>
              <ul className="nav-links">
                <li><a href="/">Home</a></li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="container main-content" style={{ minHeight: "80vh" }}>
          {children}
        </main>

        <footer className="main-footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Premium PR Agency. All rights reserved.</p>
          </div>
        </footer>

        {/* Global Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
