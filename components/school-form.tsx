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
  const [formData, setFormData] = useState<Partial<School>>(() => ({
    name: "",
    code: "",
    zoneName: "",
    provinceName: "",
    districtName: "",
    cluster: "",
    commune: "",
    order: 0,
    status: 1,
    image: "",
    totalStudents: 0,
    totalTeachers: 0,
    ...initialData,
  }))
  
  const [uniqueZones, setUniqueZones] = useState<string[]>([]);
  const [uniqueProvinces, setUniqueProvinces] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      console.log('SchoolForm: initialData changed:', initialData);
      setFormData(prev => ({
        name: "",
        code: "",
        zoneName: "",
        provinceName: "",
        districtName: "",
        cluster: "",
        commune: "",
        order: 0,
        status: 1,
        image: "",
        totalStudents: 0,
        totalTeachers: 0,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    const fetchUniqueFilters = async () => {
      setIsLoadingFilters(true);
      try {
        const [zones, provinces] = await Promise.all([
          DatabaseService.getUniqueZones(),
          DatabaseService.getUniqueProvinces()
        ]);
        setUniqueZones(zones);
        setUniqueProvinces(provinces);
      } catch (error) {
        console.error("Error fetching unique zones or provinces:", error);
        toast({
          title: "Warning",
          description: "Failed to load zone and province options",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFilters(false);
      }
    };
    fetchUniqueFilters();
  }, [toast]);

  const handleChange = (field: keyof School, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.name?.trim()) {
      errors.push("School name is required")
    }
    
    if (!formData.zoneName?.trim()) {
      errors.push("Zone is required")
    }
    
    if (!formData.provinceName?.trim()) {
      errors.push("Province is required")
    }
    
    if (formData.totalStudents !== undefined && formData.totalStudents < 0) {
      errors.push("Total students cannot be negative")
    }
    
    if (formData.totalTeachers !== undefined && formData.totalTeachers < 0) {
      errors.push("Total teachers cannot be negative")
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "))
      }

      const sanitizedData = {
        ...formData,
        name: formData.name?.trim(),
        code: formData.code?.trim() || undefined,
        zoneName: formData.zoneName?.trim(),
        provinceName: formData.provinceName?.trim(),
        districtName: formData.districtName?.trim() || undefined,
        cluster: formData.cluster?.trim() || undefined,
        commune: formData.commune?.trim() || undefined,
        image: formData.image?.trim() || undefined,
        totalStudents: Math.max(0, formData.totalStudents || 0),
        totalTeachers: Math.max(0, formData.totalTeachers || 0),
        order: Math.max(0, formData.order || 0)
      }

      let result
      if (initialData?.id) {
        result = await DatabaseService.updateSchool(initialData.id, sanitizedData)
      } else {
        result = await DatabaseService.createSchool(sanitizedData as Omit<School, "id" | "createdAt" | "updatedAt">)
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
          <Select onValueChange={(value) => handleChange("zoneName", value)} value={formData.zoneName || ""} required disabled={isLoadingFilters}>
            <SelectTrigger id="zoneName">
              <SelectValue placeholder={isLoadingFilters ? "Loading zones..." : "Select Zone"} />
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
          <Select onValueChange={(value) => handleChange("provinceName", value)} value={formData.provinceName || ""} required disabled={isLoadingFilters}>
            <SelectTrigger id="provinceName">
              <SelectValue placeholder={isLoadingFilters ? "Loading provinces..." : "Select Province"} />
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
              min="0"
              value={formData.order || 0}
              onChange={(e) => handleChange("order", Math.max(0, parseInt(e.target.value) || 0))}
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
              min="0"
              value={formData.totalStudents || 0}
              onChange={(e) => handleChange("totalStudents", Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div>
            <Label htmlFor="totalTeachers">Total Teachers</Label>
            <Input
              id="totalTeachers"
              type="number"
              min="0"
              value={formData.totalTeachers || 0}
              onChange={(e) => handleChange("totalTeachers", Math.max(0, parseInt(e.target.value) || 0))}
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
