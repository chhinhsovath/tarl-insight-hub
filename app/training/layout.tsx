import type React from "react"
import { Toaster } from "@/components/ui/sonner"

export default function PublicTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Toaster />
    </div>
  )
}