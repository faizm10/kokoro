import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const kalam = localFont({
  src: "../fonts/Fonts/WEB/fonts/Kalam-Regular.woff2",
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kokoro — a quiet journal",
  description: "A quiet journal that turns scattered thoughts into connected threads.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={kalam.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
