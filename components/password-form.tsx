"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { DatabaseService } from "@/lib/database"

interface PasswordFormProps {
  onSuccess?: () => void
}

export function PasswordForm({ onSuccess }: PasswordFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate passwords
      if (formData.new_password !== formData.confirm_password) {
        throw new Error("New passwords do not match")
      }

      if (formData.new_password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      // Update password
      await DatabaseService.updatePassword(formData)

      // Clear form
      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })

      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current_password">Current Password</Label>
          <Input
            id="current_password"
            type="password"
            value={formData.current_password}
            onChange={(e) => handleChange("current_password", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <Input
            id="new_password"
            type="password"
            value={formData.new_password}
            onChange={(e) => handleChange("new_password", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input
            id="confirm_password"
            type="password"
            value={formData.confirm_password}
            onChange={(e) => handleChange("confirm_password", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </div>
    </form>
  )
} 