import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaRL Insight Hub",
  description: "Teaching at the Right Level - Observation and Analytics Platform",
    generator: 'v0.dev'
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
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
            <ResizeObserverSuppressor />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
