"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { ObservationFormBuilder } from "@/components/observation-form-builder"

export default function NewObservationPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin", "Teacher", "Collector", "Coordinator"]}>
      <div className="container mx-auto py-6">
        <ObservationFormBuilder />
      </div>
    </ProtectedRoute>
  )
}
