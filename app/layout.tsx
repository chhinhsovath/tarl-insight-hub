import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { GlobalLoadingProvider } from "@/lib/global-loading-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import { GlobalLoadingOverlay } from "@/components/global-loading-overlay"
import { UniversalLoadingStyles } from "@/components/universal-loading"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Note: Hanuman font is loaded via Google Fonts in the head section below
// This provides broader character set support for both English and Khmer text

export const metadata: Metadata = {
  title: "មជ្ឈមណ្ឌលអន្តរកម្ម TaRL Insight Hub",
  description: "TaRL Insight Hub - Teaching at the Right Level Management System",
  generator: 'v0.dev',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '60x60' },
      { url: '/icon.png', type: 'image/png', sizes: '60x60' },
    ],
    apple: '/apple-icon.png',
  },
}

function ResizeObserverSuppressor() {
  if (typeof window === 'undefined') return null
  
  const originalError = console.error
  console.error = (...args) => {
    if (args[0]?.includes?.("ResizeObserver loop completed with undelivered notifications")) {
      return
    }
    originalError(...args)
  }
  
  return null
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Hanuman:wght@100;300;400;500;600;700;900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            <GlobalLoadingProvider>
              {children}
              <GlobalLoadingOverlay />
              <UniversalLoadingStyles />
              <Toaster />
              <ResizeObserverSuppressor />
            </GlobalLoadingProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
