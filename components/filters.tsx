"use client"

import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseService } from "@/lib/database"
import type { Province, District, School } from "@/lib/types"

interface FiltersProps {
  onFilterChange: (filters: {
    provinceId?: number
    districtId?: number
    schoolId?: number
  }) => void
}

export function Filters({ onFilterChange }: FiltersProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [schools, setSchools] = useState<School[]>([])

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("all")
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("all")
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all")

  // Load provinces on mount
  useEffect(() => {
    loadProvinces()
  }, [])

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvinceId !== "all") {
      loadDistricts(Number.parseInt(selectedProvinceId))
    } else {
      setDistricts([])
    }
    // Reset dependent selections
    setSelectedDistrictId("all")
    setSelectedSchoolId("all")
  }, [selectedProvinceId])

  // Load schools when province or district changes
  useEffect(() => {
    if (selectedProvinceId !== "all") {
      if (selectedDistrictId !== "all") {
        loadSchoolsByDistrict(Number.parseInt(selectedDistrictId))
      } else {
        loadSchoolsByProvince(Number.parseInt(selectedProvinceId))
      }
    } else {
      setSchools([])
    }
    // Reset school selection
    setSelectedSchoolId("all")
  }, [selectedProvinceId, selectedDistrictId])

  // Notify parent of filter changes
  const notifyFilterChange = useCallback(() => {
    onFilterChange({
      provinceId: selectedProvinceId !== "all" ? Number.parseInt(selectedProvinceId) : undefined,
      districtId: selectedDistrictId !== "all" ? Number.parseInt(selectedDistrictId) : undefined,
      schoolId: selectedSchoolId !== "all" ? Number.parseInt(selectedSchoolId) : undefined,
    })
  }, [selectedProvinceId, selectedDistrictId, selectedSchoolId, onFilterChange])

  // Call filter change notification
  useEffect(() => {
    notifyFilterChange()
  }, [notifyFilterChange])

  const loadProvinces = async () => {
    try {
      const data = await DatabaseService.getProvinces()
      setProvinces(data)
    } catch (error) {
      console.error("Error loading provinces:", error)
    }
  }

  // Fix the loadDistricts function to handle string input
  const loadDistricts = async (provinceId: number | string) => {
    try {
      const data = await DatabaseService.getDistrictsByProvince(provinceId)
      setDistricts(data)
    } catch (error) {
      console.error("Error loading districts:", error)
    }
  }

  // Fix the loadSchoolsByProvince function to handle string input
  const loadSchoolsByProvince = async (provinceId: number | string) => {
    try {
      const data = await DatabaseService.getSchoolsByProvince(provinceId)
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools by province:", error)
    }
  }

  // Fix the loadSchoolsByDistrict function to handle string input
  const loadSchoolsByDistrict = async (districtId: number | string) => {
    try {
      const data = await DatabaseService.getSchoolsByDistrict(districtId)
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools by district:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Province</label>
          <Select value={selectedProvinceId} onValueChange={setSelectedProvinceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Province" />
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
          <label className="text-sm font-medium mb-2 block">District</label>
          <Select
            value={selectedDistrictId}
            onValueChange={setSelectedDistrictId}
            disabled={selectedProvinceId === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select District" />
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
          <label className="text-sm font-medium mb-2 block">School</label>
          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId} disabled={selectedProvinceId === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Select School" />
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
      </CardContent>
    </Card>
  )
}
