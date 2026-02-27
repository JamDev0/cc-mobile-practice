import type { Metadata } from "next";
import { Outfit, DM_Sans, Sora, Manrope, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mobile Practice",
  description: "Mobile web app for solving PDF-based exams",
};

const fontVars = [
  outfit.variable,
  dmSans.variable,
  sora.variable,
  manrope.variable,
  plusJakarta.variable,
  jetbrainsMono.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="ink" className={fontVars} suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
