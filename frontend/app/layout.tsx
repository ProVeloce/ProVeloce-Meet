import { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Roboto } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthHeader from "@/components/AuthHeader";
import ErrorBoundary from "@/components/ErrorBoundary";

// Use Roboto font (Google's standard font, similar to Google Sans)
const roboto = Roboto({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ProVeloce Meet",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://meet.proveloce.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://meet.proveloce.com",
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
    icon: "/icons/logo.jpeg",
    apple: "/icons/logo.jpeg",
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
          logoImageUrl: "/icons/logo.jpeg",
        },
        variables: {
          colorText: "#202124",
          colorPrimary: "#1A73E8",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#F8F9FA",
          colorInputText: "#202124",
        },
      }}
    >
      <html lang="en">
        <body className={`${roboto.variable} ${roboto.className} bg-light-2 text-text-primary`}>
          <ErrorBoundary>
            <AuthHeader />
            <Toaster />
            {children}
          </ErrorBoundary>
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
