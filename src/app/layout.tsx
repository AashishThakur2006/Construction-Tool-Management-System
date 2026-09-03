import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Plinth",
  description:
    "Plinth — the plant register for construction firms. Jobs, assets, allocation, maintenance and payments in one place.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%233e5c48'/%3E%3Cpath d='M8 24V9h9a5 5 0 0 1 0 10h-5v5z' fill='%23fbfaf6'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#10120e",
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
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Public+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
