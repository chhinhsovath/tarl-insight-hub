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
<<<<<<< HEAD
  const [formData, setFormData] = useState<Partial<School>>(() => ({
    name: "",
    code: "",
    zoneName: "",
    provinceName: "",
    districtName: "",
    status: 1,
    totalStudents: 0,
    totalTeachers: 0,
    ...initialData,
  }))
  
  const [uniqueZones, setUniqueZones] = useState<string[]>([]);
  const [uniqueProvinces, setUniqueProvinces] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
=======
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
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
<<<<<<< HEAD
    if (initialData) {
      console.log('SchoolForm: initialData changed:', initialData);
      setFormData(prev => ({
        name: "",
        code: "",
        zoneName: "",
        provinceName: "",
        districtName: "",
        status: 1,
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
=======
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
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc

  const handleChange = (field: keyof School, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

<<<<<<< HEAD
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

=======
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
<<<<<<< HEAD
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
        totalStudents: Math.max(0, formData.totalStudents || 0),
        totalTeachers: Math.max(0, formData.totalTeachers || 0),
=======
      if (!formData.name || !formData.provinceName || !formData.zoneName) {
        throw new Error("School Name, Zone, and Province are required fields.")
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
      }

      let result
      if (initialData?.id) {
<<<<<<< HEAD
        result = await DatabaseService.updateSchool(initialData.id, sanitizedData)
      } else {
        result = await DatabaseService.createSchool(sanitizedData as Omit<School, "id" | "createdAt" | "updatedAt">)
=======
        // Update existing school
        result = await DatabaseService.updateSchool(initialData.id, formData)
      } else {
        // Create new school
        result = await DatabaseService.createSchool(formData as Omit<School, "id" | "createdAt" | "updatedAt">)
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
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
<<<<<<< HEAD
    <div className="bg-white rounded-2xl shadow p-8 w-full">
      <h2 className="text-2xl font-bold mb-1">{initialData?.id ? 'Edit School' : 'Add School'}</h2>
      <p className="text-gray-500 mb-8">Update school information</p>
      <form id="school-edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label htmlFor="name" className="block font-semibold mb-2">School Name</label>
=======
    <form id="school-edit-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">School Name <span className="text-red-500">*</span></Label>
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
          <Input
            id="name"
            className="w-full rounded-lg border px-4 py-3"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div>
<<<<<<< HEAD
          <label htmlFor="code" className="block font-semibold mb-2">School Code</label>
=======
          <Label htmlFor="code">School Code</Label>
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
          <Input
            id="code"
            className="w-full rounded-lg border px-4 py-3"
            value={formData.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
          />
        </div>
<<<<<<< HEAD
        <div>
          <label htmlFor="zoneName" className="block font-semibold mb-2">Zone</label>
          <Select onValueChange={(value) => handleChange("zoneName", value)} value={formData.zoneName || ""} required disabled={isLoadingFilters}>
            <SelectTrigger id="zoneName" className="w-full rounded-lg border px-4 py-3">
              <SelectValue placeholder={isLoadingFilters ? "Loading zones..." : "Select Zone"} />
=======
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="zoneName">Zone <span className="text-red-500">*</span></Label>
          <Select onValueChange={(value) => handleChange("zoneName", value)} value={formData.zoneName || ""} required>
            <SelectTrigger id="zoneName">
              <SelectValue placeholder="Select Zone" />
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
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
<<<<<<< HEAD
          <label htmlFor="provinceName" className="block font-semibold mb-2">Province</label>
          <Select onValueChange={(value) => handleChange("provinceName", value)} value={formData.provinceName || ""} required disabled={isLoadingFilters}>
            <SelectTrigger id="provinceName" className="w-full rounded-lg border px-4 py-3">
              <SelectValue placeholder={isLoadingFilters ? "Loading provinces..." : "Select Province"} />
=======
          <Label htmlFor="provinceName">Province <span className="text-red-500">*</span></Label>
          <Select onValueChange={(value) => handleChange("provinceName", value)} value={formData.provinceName || ""} required>
            <SelectTrigger id="provinceName">
              <SelectValue placeholder="Select Province" />
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
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
<<<<<<< HEAD
          <label htmlFor="districtName" className="block font-semibold mb-2">District</label>
          <Input
            id="districtName"
            className="w-full rounded-lg border px-4 py-3"
            value={formData.districtName || ""}
            onChange={(e) => handleChange("districtName", e.target.value)}
          />
        </div>
        {!hideExtraFields && (
          <>
            <div>
              <label htmlFor="totalStudents" className="block font-semibold mb-2">Total Students</label>
              <Input
                id="totalStudents"
                type="number"
                min="0"
                className="w-full rounded-lg border px-4 py-3"
                value={formData.totalStudents || 0}
                onChange={(e) => handleChange("totalStudents", Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label htmlFor="totalTeachers" className="block font-semibold mb-2">Total Teachers</label>
              <Input
                id="totalTeachers"
                type="number"
                min="0"
                className="w-full rounded-lg border px-4 py-3"
                value={formData.totalTeachers || 0}
                onChange={(e) => handleChange("totalTeachers", Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label htmlFor="status" className="block font-semibold mb-2">Status</label>
              <div className="flex items-center h-full">
                <Switch
                  id="status"
                  checked={formData.status === 1}
                  onCheckedChange={(checked) => handleChange("status", checked ? 1 : 0)}
                />
                <span className="ml-2 font-medium">{formData.status === 1 ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </>
        )}
        <div className="md:col-span-2 flex justify-end mt-4">
          <Button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
            Update School
          </Button>
        </div>
      </form>
    </div>
=======
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
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
  )
}
