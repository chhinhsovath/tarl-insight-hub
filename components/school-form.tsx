"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DatabaseService } from "@/lib/database"
import type { School } from "@/lib/types"

export interface SchoolFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  school?: School
  initialData?: Partial<School>
  hideExtraFields?: boolean
}

export function SchoolForm({ onSuccess, onCancel, school, initialData, hideExtraFields }: SchoolFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<School>>(() => ({
    name: school?.name || initialData?.name || "",
    code: school?.code || initialData?.code || "",
    zoneName: school?.zoneName || initialData?.zoneName || "",
    provinceName: school?.provinceName || initialData?.provinceName || "",
    districtName: school?.districtName || initialData?.districtName || "",
    status: school?.status || initialData?.status || 1,
    totalStudents: school?.totalStudents || initialData?.totalStudents || 0,
    totalTeachers: school?.totalTeachers || initialData?.totalTeachers || 0,
    totalTeachersFemale: school?.totalTeachersFemale || initialData?.totalTeachersFemale || 0,
    totalStudentsFemale: school?.totalStudentsFemale || initialData?.totalStudentsFemale || 0,
    ...initialData,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (school?.id) {
        // Update existing school
        await DatabaseService.updateSchool(school.id, formData)
        toast({
          title: "Success",
          description: "School updated successfully",
        })
      } else {
        // Create new school
        await DatabaseService.createSchool(formData)
        toast({
          title: "Success", 
          description: "School created successfully",
        })
      }
      onSuccess?.()
    } catch (error) {
      console.error('Error saving school:', error)
      toast({
        title: "Error",
        description: "Failed to save school",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof School, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div>
        <Label htmlFor="name" className="block font-semibold mb-2">School Name</Label>
        <Input 
          id="name" 
          className="w-full rounded-lg border px-4 py-3" 
          value={formData.name || ""} 
          onChange={e => handleChange("name", e.target.value)} 
          required 
        />
      </div>

      <div>
        <Label htmlFor="code" className="block font-semibold mb-2">School Code</Label>
        <Input 
          id="code" 
          className="w-full rounded-lg border px-4 py-3" 
          value={formData.code || ""} 
          onChange={e => handleChange("code", e.target.value)} 
        />
      </div>

      <div>
        <Label htmlFor="zoneName" className="block font-semibold mb-2">Zone</Label>
        <Input 
          id="zoneName" 
          className="w-full rounded-lg border px-4 py-3" 
          value={formData.zoneName || ""} 
          onChange={e => handleChange("zoneName", e.target.value)} 
        />
      </div>

      <div>
        <Label htmlFor="provinceName" className="block font-semibold mb-2">Province</Label>
        <Input 
          id="provinceName" 
          className="w-full rounded-lg border px-4 py-3" 
          value={formData.provinceName || ""} 
          onChange={e => handleChange("provinceName", e.target.value)} 
        />
      </div>

      <div>
        <Label htmlFor="districtName" className="block font-semibold mb-2">District</Label>
        <Input 
          id="districtName" 
          className="w-full rounded-lg border px-4 py-3" 
          value={formData.districtName || ""} 
          onChange={e => handleChange("districtName", e.target.value)} 
        />
      </div>

      <div>
        <Label htmlFor="status" className="block font-semibold mb-2">Status</Label>
        <select 
          id="status" 
          value={formData.status || 1} 
          onChange={e => handleChange("status", Number(e.target.value))} 
          className="w-full rounded-lg border px-4 py-3 text-base"
        >
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </select>
      </div>

      {!hideExtraFields && (
        <>
          <div>
            <Label htmlFor="totalStudents" className="block font-semibold mb-2">Total Students</Label>
            <Input 
              id="totalStudents" 
              type="number" 
              className="w-full rounded-lg border px-4 py-3" 
              value={formData.totalStudents || 0} 
              onChange={e => handleChange("totalStudents", Number(e.target.value))} 
            />
          </div>

          <div>
            <Label htmlFor="totalStudentsFemale" className="block font-semibold mb-2">Female Students</Label>
            <Input 
              id="totalStudentsFemale" 
              type="number" 
              className="w-full rounded-lg border px-4 py-3" 
              value={formData.totalStudentsFemale || 0} 
              onChange={e => handleChange("totalStudentsFemale", Number(e.target.value))} 
            />
          </div>

          <div>
            <Label htmlFor="totalTeachers" className="block font-semibold mb-2">Total Teachers</Label>
            <Input 
              id="totalTeachers" 
              type="number" 
              className="w-full rounded-lg border px-4 py-3" 
              value={formData.totalTeachers || 0} 
              onChange={e => handleChange("totalTeachers", Number(e.target.value))} 
            />
          </div>

          <div>
            <Label htmlFor="totalTeachersFemale" className="block font-semibold mb-2">Female Teachers</Label>
            <Input 
              id="totalTeachersFemale" 
              type="number" 
              className="w-full rounded-lg border px-4 py-3" 
              value={formData.totalTeachersFemale || 0} 
              onChange={e => handleChange("totalTeachersFemale", Number(e.target.value))} 
            />
          </div>
        </>
      )}

      <div className="md:col-span-2 flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : school?.id ? "Update School" : "Create School"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}