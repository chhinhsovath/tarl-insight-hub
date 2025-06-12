"use client"

import type React from "react"

import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function DefaultLoadingFallback() {
  return (
    <Card className="soft-card">
      <CardContent className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingWrapper({ children, fallback }: LoadingWrapperProps) {
  return <Suspense fallback={fallback || <DefaultLoadingFallback />}>{children}</Suspense>
}
