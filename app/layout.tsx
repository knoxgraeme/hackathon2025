import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "./providers/SessionProvider";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Photography Assistant",
  description: "Plan your perfect photoshoot with AI-powered location scouting and storyboarding",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Photo AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <div className="min-h-screen relative">
            {/* Safe area padding for iOS devices */}
            <div className="fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-black z-50" />
            
            {/* Main content with safe area padding */}
            <div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)] min-h-screen">
              {children}
            </div>
          </div>
          <PWAInstallPrompt />
        </SessionProvider>
      </body>
    </html>
  );
}
