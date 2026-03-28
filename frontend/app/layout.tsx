import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "E-commerce Recommender MVP",
  description: "Dataset-driven ecommerce recommendation sandbox with offline evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
