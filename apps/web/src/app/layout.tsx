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
  const apiBaseUrl =
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://127.0.0.1:4000";
  const privyAppId =
    process.env.PRIVY_APP_ID?.trim() ||
    process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ||
    null;

  return (
    <html data-scroll-behavior="smooth" lang="pt-BR">
      <body className={`${interfaceFont.variable} ${displayFont.variable}`}>
        <AppProviders apiBaseUrl={apiBaseUrl} privyAppId={privyAppId}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
