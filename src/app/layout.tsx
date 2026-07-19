import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construction Tool Management System",
  description:
    "Centralized platform to manage construction projects, machines, employees, maintenance and payments.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
