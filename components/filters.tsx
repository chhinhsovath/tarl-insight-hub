"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import type { Province, District, School } from "@/lib/types"

interface FiltersProps {
  onFilterChange: (filters: any) => void
  showRoleFilter?: boolean
}

export function Filters({ onFilterChange, showRoleFilter = false }: FiltersProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState<string>("all")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all")
  const [selectedSchool, setSelectedSchool] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")

  useEffect(() => {
    loadProvinces()
  }, [])

  useEffect(() => {
    if (selectedProvince !== "all") {
      loadDistricts(Number.parseInt(selectedProvince))
      loadSchoolsByProvince(Number.parseInt(selectedProvince))
    } else {
      setDistricts([])
      setSchools([])
    }
    setSelectedDistrict("all")
    setSelectedSchool("all")
  }, [selectedProvince])

  useEffect(() => {
    if (selectedDistrict !== "all") {
      loadSchoolsByDistrict(Number.parseInt(selectedDistrict))
    }
    setSelectedSchool("all")
  }, [selectedDistrict])

  const notifyFilterChange = useCallback(() => {
    const filters = {
      provinceId: selectedProvince !== "all" ? Number.parseInt(selectedProvince) : null,
      districtId: selectedDistrict !== "all" ? Number.parseInt(selectedDistrict) : null,
      schoolId: selectedSchool !== "all" ? Number.parseInt(selectedSchool) : null,
      role: selectedRole !== "all" ? selectedRole : null,
      subject: selectedSubject !== "all" ? selectedSubject : null,
    }
    onFilterChange(filters)
  }, [selectedProvince, selectedDistrict, selectedSchool, selectedRole, selectedSubject, onFilterChange])

  // Call filter change notification when any filter changes
  useEffect(() => {
    notifyFilterChange()
  }, [notifyFilterChange])

  const loadProvinces = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/provinces')
      const data: Province[] = await res.json()
      setProvinces(data)
    } catch (error) {
      console.error("Error loading provinces:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDistricts = async (provinceId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/districts?provinceId=${provinceId}`)
      const data: District[] = await res.json()
      setDistricts(data)
    } catch (error) {
      console.error("Error loading districts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSchoolsByProvince = async (provinceId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/schools?provinceId=${provinceId}`)
      const data: School[] = await res.json()
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSchoolsByDistrict = async (districtId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/schools?districtId=${districtId}`)
      const data: School[] = await res.json()
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSelectedProvince("all")
    setSelectedDistrict("all")
    setSelectedSchool("all")
    setSelectedRole("all")
    setSelectedSubject("all")
  }

  return (
    <Card className="soft-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Filters</CardTitle>
        <Button variant="ghost" size="icon" onClick={resetFilters} className="h-8 w-8">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Province</label>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger>
              <SelectValue placeholder="All Provinces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id.toString()}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">District</label>
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={selectedProvince === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">School</label>
          <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={selectedProvince === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id.toString()}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showRoleFilter && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="collector">Collector</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="Math">TaRL Math</SelectItem>
              <SelectItem value="Khmer">TaRL Khmer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
