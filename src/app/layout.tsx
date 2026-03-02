import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegistration } from "@/shared/ServiceWorkerRegistration";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
  manifest: "/manifest.json",
};

const fontVars = [dmSans.variable, jetbrainsMono.variable].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
