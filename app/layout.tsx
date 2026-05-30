import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Vortex Brain",
  description: "Personal AI second brain & digital twin",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B0C10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${lexend.variable} font-sans bg-bg text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
