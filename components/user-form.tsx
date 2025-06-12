"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { Province, District, School } from "@/lib/types"

interface UserFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "Teacher",
    school_id: "",
    province_id: "",
    district_id: "",
    gender: "Male",
    date_of_birth: "",
    years_of_experience: "",
    is_active: true,
  })

  useEffect(() => {
    loadProvinces()
  }, [])

  useEffect(() => {
    if (form.province_id) {
      loadDistricts(Number(form.province_id))
      loadSchoolsByProvince(Number(form.province_id))
    } else {
      setDistricts([])
      setSchools([])
    }
    // Reset dependent fields
    setForm((prev) => ({ ...prev, district_id: "", school_id: "" }))
  }, [form.province_id])

  useEffect(() => {
    if (form.district_id) {
      loadSchoolsByDistrict(Number(form.district_id))
    }
    // Reset school
    setForm((prev) => ({ ...prev, school_id: "" }))
  }, [form.district_id])

  const loadProvinces = async () => {
    try {
      const data = await DatabaseService.getProvinces()
      setProvinces(data)
    } catch (error) {
      console.error("Error loading provinces:", error)
    }
  }

  const loadDistricts = async (provinceId: number) => {
    try {
      const data = await DatabaseService.getDistrictsByProvince(provinceId)
      setDistricts(data)
    } catch (error) {
      console.error("Error loading districts:", error)
    }
  }

  const loadSchoolsByProvince = async (provinceId: number) => {
    try {
      const data = await DatabaseService.getSchoolsByProvince(provinceId)
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools by province:", error)
    }
  }

  const loadSchoolsByDistrict = async (districtId: number) => {
    try {
      const data = await DatabaseService.getSchoolsByDistrict(districtId)
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools by district:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userData = {
        ...form,
        province_id: form.province_id ? Number(form.province_id) : undefined,
        district_id: form.district_id ? Number(form.district_id) : undefined,
        school_id: form.school_id ? Number(form.school_id) : undefined,
        years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : undefined,
      }

      const result = await DatabaseService.createUser(userData)

      if (result) {
        toast({
          title: "User Added",
          description: "The user has been successfully added.",
        })
        if (onSuccess) onSuccess()
      } else {
        throw new Error("Failed to add user")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Teacher">Teacher</SelectItem>
              <SelectItem value="Coordinator">Coordinator</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Select
            value={form.province_id.toString()}
            onValueChange={(value) => setForm({ ...form, province_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id.toString()}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select
            value={form.district_id.toString()}
            onValueChange={(value) => setForm({ ...form, district_id: value })}
            disabled={!form.province_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Select
            value={form.school_id.toString()}
            onValueChange={(value) => setForm({ ...form, school_id: value })}
            disabled={!form.province_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id.toString()}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_of_experience">Years of Experience</Label>
          <Input
            id="years_of_experience"
            type="number"
            value={form.years_of_experience}
            onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <RadioGroup
            value={form.gender}
            onValueChange={(value) => setForm({ ...form, gender: value })}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Male" id="male" />
              <Label htmlFor="male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Female" id="female" />
              <Label htmlFor="female">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={form.is_active}
          onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
        />
        <Label htmlFor="is_active">Active User</Label>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save User"}
        </Button>
      </div>
    </form>
  )
}
