"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SchoolForm } from "@/components/school-form"
import { DatabaseService } from "@/lib/database"
import { ProtectedRoute } from "@/components/protected-route"
import { School, MapPin, Phone, Mail, Users, Plus } from "lucide-react"
import type { School as SchoolType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { CardDescription, CardFooter } from "@/components/ui/card"

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolType[]>([])
  const [totalSchoolsCount, setTotalSchoolsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterProvince, setFilterProvince] = useState("all");
  const [uniqueZones, setUniqueZones] = useState<string[]>([]);
  const [uniqueProvinces, setUniqueProvinces] = useState<string[]>([]);

  useEffect(() => {
    loadSchools()
    loadSchoolsCount();
  }, [filters, currentPage, searchTerm, filterZone, filterProvince])

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

  const loadSchools = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const data = await DatabaseService.getSchools({
        search: searchTerm,
        limit: itemsPerPage,
        offset: offset,
        zone: filterZone === 'all' ? '' : filterZone,
        province: filterProvince === 'all' ? '' : filterProvince,
      })
      setSchools(data)
    } catch (error) {
      console.error("Error loading schools:", error)
      setSchools([]) // Fallback to empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadSchoolsCount = async () => {
    try {
      const data = await DatabaseService.getSchools({
        count: true,
        search: searchTerm,
        zone: filterZone === 'all' ? '' : filterZone,
        province: filterProvince === 'all' ? '' : filterProvince,
      });
      setTotalSchoolsCount(data.total);
    } catch (error) {
      console.error("Error loading schools count:", error);
      setTotalSchoolsCount(0);
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
    setCurrentPage(1); // Reset to first page on filter change
  }, [])

  const handleAddSchool = () => {
    setShowAddDialog(true)
  }

  const handleSchoolAdded = () => {
    setShowAddDialog(false)
    loadSchools()
    loadSchoolsCount();
  }

  const totalPages = Math.ceil(totalSchoolsCount / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout title="Schools" description="Manage your schools">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4 justify-between">
            <div className="flex gap-4">
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {/* Filter by Zone */}
              <Select onValueChange={(value) => setFilterZone(value)} value={filterZone}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {uniqueZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Filter by Province */}
              <Select onValueChange={(value) => setFilterProvince(value)} value={filterProvince}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {uniqueProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link href="/schools/new">
              <Button className={cn(buttonVariants({ variant: "default" }))}>
                Add School
              </Button>
            </Link>
          </div>

          {loading ? (
            <p>Loading schools...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schools.map((school) => (
                <Card key={school.id}>
                  <CardHeader>
                    <CardTitle>{school.name}</CardTitle>
                    <CardDescription>
                      {school.zoneName && `Zone: ${school.zoneName}`}
                      {school.zoneName && school.provinceName && " | "}
                      {school.provinceName && `Province: ${school.provinceName}`}
                      {school.districtName && " | "}
                      {school.districtName && `District: ${school.districtName}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Code: {school.code}</p>
                    {school.cluster && <p>Cluster: {school.cluster}</p>}
                    {school.commune && <p>Commune: {school.commune}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Link
                      href={`/schools/${school.id}`}
                    >
                      <Button className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        View
                      </Button>
                    </Link>
                    <Link
                      href={`/schools/${school.id}/edit`}
                    >
                      <Button className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                        Edit
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {schools.length} of {totalSchoolsCount} schools.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage * itemsPerPage >= totalSchoolsCount}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
