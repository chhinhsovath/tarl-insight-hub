"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { School } from "@/lib/types"

interface SchoolFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<School>
  hideExtraFields?: boolean
}

export function SchoolForm({ onSuccess, onCancel, initialData, hideExtraFields }: SchoolFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<School>>(
    initialData || {
      name: "",
      code: "",
      zoneName: "",
      provinceName: "",
      districtName: "",
      cluster: "",
      commune: "",
      order: 0,
      status: 1, // Default to active
      image: "",
      totalStudents: 0,
      totalTeachers: 0,
    },
  )
  
  const [uniqueZones, setUniqueZones] = useState<string[]>([]);
  const [uniqueProvinces, setUniqueProvinces] = useState<string[]>([]);

  useEffect(() => {
    const fetchUniqueFilters = async () => {
      try {
        const zones = await DatabaseService.getUniqueZones();
        setUniqueZones(zones);
        const provinces = await DatabaseService.getUniqueProvinces();
        setUniqueProvinces(provinces);
      } catch (error) {
        console.error("Error fetching unique zones or provinces:", error);
      }
    };
    fetchUniqueFilters();
  }, []);

  const handleChange = (field: keyof School, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name || !formData.provinceName || !formData.zoneName) {
        throw new Error("School Name, Zone, and Province are required fields.")
      }

      let result
      if (initialData?.id) {
        // Update existing school
        result = await DatabaseService.updateSchool(initialData.id, formData)
      } else {
        // Create new school
        result = await DatabaseService.createSchool(formData as Omit<School, "id" | "createdAt" | "updatedAt">)
      }

      if (result) {
        toast({
          title: "Success",
          description: `School ${initialData?.id ? "updated" : "created"} successfully`,
        })
        if (onSuccess) onSuccess()
      } else {
        throw new Error("Failed to save school")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save school",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="school-edit-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">School Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="code">School Code</Label>
          <Input
            id="code"
            value={formData.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="zoneName">Zone <span className="text-red-500">*</span></Label>
          <Select onValueChange={(value) => handleChange("zoneName", value)} value={formData.zoneName || ""} required>
            <SelectTrigger id="zoneName">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              {uniqueZones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="provinceName">Province <span className="text-red-500">*</span></Label>
          <Select onValueChange={(value) => handleChange("provinceName", value)} value={formData.provinceName || ""} required>
            <SelectTrigger id="provinceName">
              <SelectValue placeholder="Select Province" />
            </SelectTrigger>
            <SelectContent>
              {uniqueProvinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="districtName">District</Label>
          <Input
            id="districtName"
            value={formData.districtName || ""}
            onChange={(e) => handleChange("districtName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cluster">Cluster</Label>
          <Input
            id="cluster"
            value={formData.cluster || ""}
            onChange={(e) => handleChange("cluster", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="commune">Commune</Label>
          <Input
            id="commune"
            value={formData.commune || ""}
            onChange={(e) => handleChange("commune", e.target.value)}
          />
        </div>
      </div>

      {!hideExtraFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order || 0}
              onChange={(e) => handleChange("order", parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="status"
                checked={formData.status === 1}
                onCheckedChange={(checked) => handleChange("status", checked ? 1 : 0)}
              />
              <Label htmlFor="status">{formData.status === 1 ? "Active" : "Inactive"}</Label>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={formData.image || ""}
          onChange={(e) => handleChange("image", e.target.value)}
        />
      </div>

      {!hideExtraFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalStudents">Total Students</Label>
            <Input
              id="totalStudents"
              type="number"
              value={formData.totalStudents || 0}
              onChange={(e) => handleChange("totalStudents", parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="totalTeachers">Total Teachers</Label>
            <Input
              id="totalTeachers"
              type="number"
              value={formData.totalTeachers || 0}
              onChange={(e) => handleChange("totalTeachers", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* Remove the submit button from here as it will be moved to the parent component */}
      {/* <Button type="submit" className="w-fit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ""}
        {initialData?.id ? "Update School" : "Create School"}
      </Button> */}
    </form>
  )
}
