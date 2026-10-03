import type { Metadata } from "next";
import Script from "next/script";
import SiteHeader from "./_components/SiteHeader";
import SiteFooter from "./_components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "Plinth — the plant register for construction firms",
    template: "%s — Plinth",
  },
  description:
    "Plinth keeps every job, asset, allocation, fault and payment on one register. Owner and Site Engineer see exactly what they should.",
};

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <link rel="stylesheet" href="/landing.css" />
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <Script src="/landing.js" strategy="afterInteractive" />
    </>
  );
}
