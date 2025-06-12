import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaRL Insight Hub",
  description: "Teaching at the Right Level - Observation and Analytics Platform",
    generator: 'v0.dev'
}

// Suppress ResizeObserver warnings
if (typeof window !== "undefined") {
  const originalError = console.error
  console.error = (...args) => {
    if (args[0]?.includes?.("ResizeObserver loop completed with undelivered notifications")) {
      return
    }
    originalError(...args)
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress ResizeObserver warnings
              const originalError = console.error;
              console.error = function(...args) {
                if (args[0] && args[0].includes && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
                  return;
                }
                originalError.apply(console, args);
              };
            `,
          }}
        />
      </body>
    </html>
  )
}
