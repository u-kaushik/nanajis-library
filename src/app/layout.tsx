import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nanaji's Library",
  description:
    "A personal document library for browsing, uploading, and viewing documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
