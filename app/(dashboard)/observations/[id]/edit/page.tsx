"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function EditObservationPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // For now, redirect to the new observation form
    // In a full implementation, you would pre-fill the form with existing data
    router.push(`/observations/new?edit=${params.id}`)
  }, [params.id, router])

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher", "collector"]}>
      <div className="flex items-center justify-center h-64">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    </ProtectedRoute>
  )
}
