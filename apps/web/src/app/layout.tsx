import type { Metadata } from "next";
import { Archivo, Barlow_Condensed } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const interfaceFont = Archivo({
  variable: "--font-interface",
  subsets: ["latin"],
});

const displayFont = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Token F.C.",
  description: "O token que transforma torcida em economia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="pt-BR">
      <body className={`${interfaceFont.variable} ${displayFont.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
