import { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthHeader from "@/components/AuthHeader";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ProVeloce Meet - Secure Online Meeting Platform | Real-Time Video Calling",
    template: "%s | ProVeloce Meet",
  },
  description: "Professional video conferencing software for businesses. Host secure online meetings with real-time collaboration, meeting recording, and participant analytics. Browser-based WebRTC solution.",
  keywords: [
    "secure online meeting platform",
    "real-time video calling app",
    "business video conferencing software",
    "remote collaboration tool",
    "host controlled meeting system",
    "browser-based WebRTC solution",
    "meeting recording and history tracking",
    "cloud meeting dashboard",
    "participant attendance analytics",
  ],
  authors: [{ name: "ProVeloce" }],
  creator: "ProVeloce",
  publisher: "ProVeloce",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://proveloce-meet.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://proveloce-meet.vercel.app",
    siteName: "ProVeloce Meet",
    title: "ProVeloce Meet - Secure Online Meeting Platform",
    description: "Professional video conferencing software for businesses. Host secure online meetings with real-time collaboration.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProVeloce Meet - Secure Online Meeting Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProVeloce Meet - Secure Online Meeting Platform",
    description: "Professional video conferencing software for businesses.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icons/logo.svg",
    apple: "/icons/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsVariant: "iconButton",
          logoImageUrl: "/icons/logo.svg",
        },
        variables: {
          colorText: "#fff",
          colorPrimary: "#3B82F6",
          colorBackground: "#0F172A",
          colorInputBackground: "#1E293B",
          colorInputText: "#fff",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} bg-dark-2`}>
          <ErrorBoundary>
            <AuthHeader />
            <Toaster />
            {children}
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
