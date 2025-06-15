"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { User } from "@/lib/types"

interface UserFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<User>
}

// Extend the User type for formData to include role_id
interface UserFormState extends Partial<User> {
  role_id?: number;
}

export function UserForm({ onSuccess, onCancel, initialData }: UserFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [formData, setFormData] = useState<UserFormState>(
    initialData
      ? { ...initialData, role_id: (initialData as any).role_id, role: undefined }
      : {
          full_name: "",
          email: "",
          phone: "",
          position: "",
          role_id: undefined,
          school_id: null,
          is_active: true,
        }
  )

  useEffect(() => {
    fetch("/api/data/roles")
      .then((res) => res.json())
      .then((data) => setRoles(data))
  }, [])

  // If editing, set role_id from role name if needed
  useEffect(() => {
    if (
      initialData &&
      typeof initialData.role === "string" &&
      roles.length > 0 &&
      !formData.role_id
    ) {
      const found = roles.find((r) => r.name.toLowerCase() === initialData.role!.toLowerCase())
      if (found) setFormData((prev) => ({ ...prev, role_id: found.id }))
    }
  }, [initialData, roles])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.full_name || !formData.role_id) {
        throw new Error("Please fill in all required fields")
      }

      // Create or update user
      let result
      if (initialData?.id) {
        // Update existing user
        result = await DatabaseService.updateUser(initialData.id, formData)
      } else {
        // Create new user
        result = await DatabaseService.createUser(formData)
      }

      if (result) {
        toast({
          title: "Success",
          description: `User ${initialData?.id ? "updated" : "created"} successfully`,
        })
        if (onSuccess) onSuccess()
      } else {
        throw new Error("Failed to save user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            value={formData.full_name || ""}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={formData.position || ""}
            onChange={(e) => handleChange("position", e.target.value)}
            placeholder="Enter position"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role_id">
            Role <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.role_id ? String(formData.role_id) : ""}
            onValueChange={(value) => handleChange("role_id", Number(value))}
            required
          >
            <SelectTrigger id="role_id">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Account Status</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleChange("is_active", checked)}
        />
          <span className="ml-2 text-sm text-gray-600">{formData.is_active ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  )
}
