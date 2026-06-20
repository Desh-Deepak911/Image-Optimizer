import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Screenshot Optimizer",
  description:
    "Optimize screenshots and photos in your browser. Crop to aspect ratios, choose export formats, and download — all processed locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
