"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageLayoutProps {
  title: string
  description?: string
  showBackButton?: boolean
  action?: {
    label: string
    onClick: () => void
    icon?: React.ComponentType<{ className?: string }>
    variant?: "default" | "outline" | "secondary"
  }
  children: React.ReactNode
}

export function PageLayout({ title, description, showBackButton, action, children }: PageLayoutProps) {
  const router = useRouter()
  const ActionIcon = action?.icon || Plus

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
            </div>
          </div>
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <ActionIcon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="space-y-6">{children}</div>
    </div>
  )
}
