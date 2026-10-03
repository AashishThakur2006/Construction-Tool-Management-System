import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Plinth",
  openGraph: {
    type: "website",
    siteName: "Plinth",
    title: "Plinth — the plant register for construction firms",
    description: "Every job, asset, allocation, fault and payment on one register.",
    images: ["/art/app-dashboard.svg"],
  },
  twitter: { card: "summary_large_image" },
  description:
    "Plinth — the plant register for construction firms. Jobs, assets, allocation, maintenance and payments in one place.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='16' fill='%230f68ea'/%3E%3Cpath d='M8 24V9h9a5 5 0 0 1 0 10h-5v5z' fill='%23ffffff'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
