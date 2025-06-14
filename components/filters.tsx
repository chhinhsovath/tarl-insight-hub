"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { Search, X } from "lucide-react"
import type { School } from "@/lib/types"

interface FiltersProps {
  onFilterChange: (filters: any) => void
  showRoleFilter?: boolean
  showSchoolFilter?: boolean
  showStatusFilter?: boolean
  showDateFilter?: boolean
  showSearch?: boolean
}

export function Filters({
  onFilterChange,
  showRoleFilter = false,
  showSchoolFilter = false,
  showStatusFilter = false,
  showDateFilter = false,
  showSearch = true,
}: FiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    schoolId: "all",
    isActive: true,
    startDate: "",
    endDate: "",
  })
  const [schools, setSchools] = useState<School[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)

  useEffect(() => {
    if (showSchoolFilter) {
      loadSchools()
    }
  }, [showSchoolFilter])

  const loadSchools = async () => {
    if (schools.length > 0) return

    setLoadingSchools(true)
    try {
      const data = await DatabaseService.getSchools()
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools:", error)
    } finally {
      setLoadingSchools(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: "",
      role: "all",
      schoolId: "all",
      isActive: true,
      startDate: "",
      endDate: "",
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filters</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSearch && (
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleChange("search", e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}

        {showRoleFilter && (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={filters.role} onValueChange={(value) => handleChange("role", value)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="collector">Collector</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showSchoolFilter && (
          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <Select
              value={filters.schoolId}
              onValueChange={(value) => handleChange("schoolId", value)}
              onOpenChange={loadSchools}
            >
              <SelectTrigger id="school">
                <SelectValue placeholder="All schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {loadingSchools ? (
                  <SelectItem value="" disabled>
                    Loading schools...
                  </SelectItem>
                ) : (
                  schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {showStatusFilter && (
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={filters.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Active Users Only</Label>
          </div>
        )}

        {showDateFilter && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}