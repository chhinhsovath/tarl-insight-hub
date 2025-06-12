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
import type { Province, District } from "@/lib/types"

interface SchoolFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function SchoolForm({ onSuccess, onCancel }: SchoolFormProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "",
    name_kh: "",
    code: "",
    province_id: "",
    district_id: "",
    address: "",
    contact_person: "",
    phone: "",
    email: "",
    director_name: "",
    total_students: "0",
    total_teachers: "0",
    is_active: true,
  })

  useEffect(() => {
    loadProvinces()
  }, [])

  useEffect(() => {
    if (form.province_id) {
      loadDistricts(Number(form.province_id))
    } else {
      setDistricts([])
    }
    // Reset district when province changes
    setForm((prev) => ({ ...prev, district_id: "" }))
  }, [form.province_id])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const schoolData = {
        ...form,
        province_id: Number(form.province_id),
        district_id: Number(form.district_id),
        total_students: Number(form.total_students),
        total_teachers: Number(form.total_teachers),
      }

      const result = await DatabaseService.createSchool(schoolData)

      if (result) {
        toast({
          title: "School Added",
          description: "The school has been successfully added.",
        })
        if (onSuccess) onSuccess()
      } else {
        throw new Error("Failed to add school")
      }
    } catch (error) {
      console.error("Error adding school:", error)
      toast({
        title: "Error",
        description: "Failed to add school. Please try again.",
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
          <Label htmlFor="name">School Name (English)</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_kh">School Name (Khmer)</Label>
          <Input id="name_kh" value={form.name_kh} onChange={(e) => setForm({ ...form, name_kh: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">School Code</Label>
          <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
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
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="director_name">Director Name</Label>
          <Input
            id="director_name"
            value={form.director_name}
            onChange={(e) => setForm({ ...form, director_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
          <Label htmlFor="total_students">Total Students</Label>
          <Input
            id="total_students"
            type="number"
            value={form.total_students}
            onChange={(e) => setForm({ ...form, total_students: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_teachers">Total Teachers</Label>
          <Input
            id="total_teachers"
            type="number"
            value={form.total_teachers}
            onChange={(e) => setForm({ ...form, total_teachers: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={form.is_active}
          onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
        />
        <Label htmlFor="is_active">Active School</Label>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save School"}
        </Button>
      </div>
    </form>
  )
}
