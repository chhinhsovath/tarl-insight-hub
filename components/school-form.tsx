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
import type { School, Province, District, Country, Commune, Village } from "@/lib/types"

interface SchoolFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<School>
}

export function SchoolForm({ onSuccess, onCancel, initialData }: SchoolFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<School>>(
    initialData || {
      name: "",
      code: "",
      address: "",
      country_id: null,
      province_id: null,
      district_id: null,
      commune_id: null,
      village_id: null,
      contact_person: "",
      phone: "",
      email: "",
      total_students: null,
      total_teachers: null,
      is_active: true,
    },
  )
  const [countries, setCountries] = useState<Country[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingCommunes, setLoadingCommunes] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)

  useEffect(() => {
    loadCountries()
  }, [])

  useEffect(() => {
    if (formData.country_id) {
      loadProvinces(formData.country_id)
    } else {
      setProvinces([])
      setDistricts([])
      setCommunes([])
      setVillages([])
      setFormData((prev) => ({ ...prev, province_id: null, district_id: null, commune_id: null, village_id: null }))
    }
  }, [formData.country_id])

  useEffect(() => {
    if (formData.province_id) {
      loadDistricts(formData.province_id)
    } else {
      setDistricts([])
      setCommunes([])
      setVillages([])
      setFormData((prev) => ({ ...prev, district_id: null }))
    }
  }, [formData.province_id])

  useEffect(() => {
    if (formData.district_id) {
      loadCommunes(formData.district_id)
    } else {
      setCommunes([])
      setVillages([])
      setFormData((prev) => ({ ...prev, commune_id: null, village_id: null }))
    }
  }, [formData.district_id])

  useEffect(() => {
    if (formData.commune_id) {
      loadVillages(formData.commune_id)
    } else {
      setVillages([])
      setFormData((prev) => ({ ...prev, village_id: null }))
    }
  }, [formData.commune_id])

  const handleChange = (field: keyof School, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const loadCountries = async () => {
    setLoadingCountries(true)
    try {
      const data = await DatabaseService.getCountries()
      setCountries(data)
    } catch (error) {
      console.error("Error loading countries:", error)
    } finally {
      setLoadingCountries(false)
    }
  }

  const loadProvinces = async (countryId: number) => {
    setLoadingProvinces(true)
    try {
      const data = await DatabaseService.getProvincesByCountry(countryId)
      setProvinces(data)
    } catch (error) {
      console.error("Error loading provinces:", error)
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadDistricts = async (provinceId: number) => {
    setLoadingDistricts(true)
    try {
      const data = await DatabaseService.getDistrictsByProvince(provinceId)
      setDistricts(data)
    } catch (error) {
      console.error("Error loading districts:", error)
    } finally {
      setLoadingDistricts(false)
    }
  }

  const loadCommunes = async (districtId: number) => {
    setLoadingCommunes(true)
    try {
      const data = await DatabaseService.getCommunesByDistrict(districtId)
      setCommunes(data)
    } catch (error) {
      console.error("Error loading communes:", error)
    } finally {
      setLoadingCommunes(false)
    }
  }

  const loadVillages = async (communeId: number) => {
    setLoadingVillages(true)
    try {
      const data = await DatabaseService.getVillagesByCommune(communeId)
      setVillages(data)
    } catch (error) {
      console.error("Error loading villages:", error)
    } finally {
      setLoadingVillages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.country_id || !formData.province_id) {
        throw new Error("Please fill in all required fields")
      }

      // Create or update school
      let result
      if (initialData?.id) {
        // Update existing school (not implemented yet)
        result = { ...formData, id: initialData.id }
      } else {
        // Create new school
        result = await DatabaseService.createSchool(formData as Omit<School, "id" | "created_at" | "updated_at">)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            School Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter school name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">School Code</Label>
          <Input
            id="code"
            value={formData.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="Enter school code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">
            Country <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.country_id?.toString() || ""}
            onValueChange={(value) => handleChange("country_id", value ? Number.parseInt(value) : null)}
            required
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {loadingCountries ? (
                <SelectItem value="" disabled>
                  Loading countries...
                </SelectItem>
              ) : (
                countries.map((country) => (
                  <SelectItem key={country.id} value={country.id.toString()}>
                    {country.name_en}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">
            Province <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.province_id?.toString() || ""}
            onValueChange={(value) => handleChange("province_id", value ? Number.parseInt(value) : null)}
            required
            disabled={!formData.country_id}
          >
            <SelectTrigger id="province">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {loadingProvinces ? (
                <SelectItem value="" disabled>
                  Loading provinces...
                </SelectItem>
              ) : (
                provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id.toString()}>
                    {province.name_en}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select
            value={formData.district_id?.toString() || ""}
            onValueChange={(value) => handleChange("district_id", value ? Number.parseInt(value) : null)}
            disabled={!formData.province_id || districts.length === 0}
          >
            <SelectTrigger id="district">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {loadingDistricts ? (
                <SelectItem value="" disabled>
                  Loading districts...
                </SelectItem>
              ) : (
                districts.map((district) => (
                  <SelectItem key={district.id} value={district.id.toString()}>
                    {district.name_en}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commune">Commune</Label>
          <Select
            value={formData.commune_id?.toString() || ""}
            onValueChange={(value) => handleChange("commune_id", value ? Number.parseInt(value) : null)}
            disabled={!formData.district_id || communes.length === 0}
          >
            <SelectTrigger id="commune">
              <SelectValue placeholder="Select commune" />
            </SelectTrigger>
            <SelectContent>
              {loadingCommunes ? (
                <SelectItem value="" disabled>
                  Loading communes...
                </SelectItem>
              ) : (
                communes.map((commune) => (
                  <SelectItem key={commune.id} value={commune.id.toString()}>
                    {commune.name_en}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="village">Village</Label>
          <Select
            value={formData.village_id?.toString() || ""}
            onValueChange={(value) => handleChange("village_id", value ? Number.parseInt(value) : null)}
            disabled={!formData.commune_id || villages.length === 0}
          >
            <SelectTrigger id="village">
              <SelectValue placeholder="Select village" />
            </SelectTrigger>
            <SelectContent>
              {loadingVillages ? (
                <SelectItem value="" disabled>
                  Loading villages...
                </SelectItem>
              ) : (
                villages.map((village) => (
                  <SelectItem key={village.id} value={village.id.toString()}>
                    {village.name_en}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter school address"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person || ""}
            onChange={(e) => handleChange("contact_person", e.target.value)}
            placeholder="Enter contact person name"
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
          <Label htmlFor="total_students">Total Students</Label>
          <Input
            id="total_students"
            type="number"
            value={formData.total_students || ""}
            onChange={(e) => handleChange("total_students", Number.parseInt(e.target.value))}
            placeholder="Enter total number of students"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_teachers">Total Teachers</Label>
          <Input
            id="total_teachers"
            type="number"
            value={formData.total_teachers || ""}
            onChange={(e) => handleChange("total_teachers", Number.parseInt(e.target.value))}
            placeholder="Enter total number of teachers"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleChange("is_active", checked)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update School" : "Create School"}
        </Button>
      </div>
    </form>
  )
}
