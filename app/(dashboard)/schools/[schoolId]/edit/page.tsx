"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { DatabaseService } from "@/lib/database"
import type { School as SchoolType } from "@/lib/types"
import { ProtectedRoute } from "@/components/protected-route"
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EditSchoolPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.schoolId as string;
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!schoolId) {
        setLoading(false);
        setError("School ID not provided.");
        return;
      }
      try {
        setLoading(true);
        const data = await DatabaseService.getSchoolById(parseInt(schoolId));
        if (data) {
          setSchool(data);
        } else {
          setError("School not found.");
        }
      } catch (err) {
        console.error("Error fetching school details:", err);
        setError("Failed to load school details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [schoolId]);

  if (loading) {
    return <PageLayout title="Loading School..." description="Fetching school details for editing...">{null}</PageLayout>;
  }

  if (error) {
    return <PageLayout title="Error" description="Could not load school details for editing."><p className="text-red-500">{error}</p></PageLayout>;
  }

  if (!school) {
    return <PageLayout title="Not Found" description="School details could not be found for editing."><p>School not found or invalid ID.</p></PageLayout>;
  }

  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout title={`Edit ${school.name}`} description="Update school information">
        <div className="flex flex-col space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{`Edit ${school.name}`}</CardTitle>
              <CardDescription>Update school information</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id="school-edit-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    const updated = await DatabaseService.updateSchool(school.id, {
                      name: school.name,
                      code: school.code,
                      zoneName: school.zoneName,
                      provinceName: school.provinceName,
                      districtName: school.districtName,
                      status: school.status,
                      totalStudents: school.totalStudents,
                      totalTeachers: school.totalTeachers,
                      totalTeachersFemale: school.totalTeachersFemale,
                      totalStudentsFemale: school.totalStudentsFemale,
                    });
                    if (updated) router.push(`/schools/${school.id}`);
                  } catch (err) {
                    setError("Failed to update school.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
              >
                <div>
                  <Label htmlFor="name" className="block font-semibold mb-2">School Name</Label>
                  <Input id="name" className="w-full rounded-lg border px-4 py-3" value={school.name || ""} onChange={e => setSchool({ ...school, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="code" className="block font-semibold mb-2">School Code</Label>
                  <Input id="code" className="w-full rounded-lg border px-4 py-3" value={school.code || ""} onChange={e => setSchool({ ...school, code: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="zoneName" className="block font-semibold mb-2">Zone</Label>
                  <Input id="zoneName" className="w-full rounded-lg border px-4 py-3" value={school.zoneName || ""} onChange={e => setSchool({ ...school, zoneName: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="provinceName" className="block font-semibold mb-2">Province</Label>
                  <Input id="provinceName" className="w-full rounded-lg border px-4 py-3" value={school.provinceName || ""} onChange={e => setSchool({ ...school, provinceName: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="districtName" className="block font-semibold mb-2">District</Label>
                  <Input id="districtName" className="w-full rounded-lg border px-4 py-3" value={school.districtName || ""} onChange={e => setSchool({ ...school, districtName: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="status" className="block font-semibold mb-2">Status</Label>
                  <select id="status" value={school.status} onChange={e => setSchool({ ...school, status: Number(e.target.value) })} className="w-full rounded-lg border px-4 py-3 text-base">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="totalStudents" className="block font-semibold mb-2">Total Students</Label>
                  <Input id="totalStudents" type="number" className="w-full rounded-lg border px-4 py-3" value={school.totalStudents ?? ""} onChange={e => setSchool({ ...school, totalStudents: Number(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor="totalTeachers" className="block font-semibold mb-2">Total Teachers</Label>
                  <Input id="totalTeachers" type="number" className="w-full rounded-lg border px-4 py-3" value={school.totalTeachers ?? ""} onChange={e => setSchool({ ...school, totalTeachers: Number(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor="totalTeachersFemale" className="block font-semibold mb-2">Total Female Teachers</Label>
                  <Input id="totalTeachersFemale" type="number" className="w-full rounded-lg border px-4 py-3" value={school.totalTeachersFemale ?? ""} onChange={e => setSchool({ ...school, totalTeachersFemale: Number(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor="totalStudentsFemale" className="block font-semibold mb-2">Total Female Students</Label>
                  <Input id="totalStudentsFemale" type="number" className="w-full rounded-lg border px-4 py-3" value={school.totalStudentsFemale ?? ""} onChange={e => setSchool({ ...school, totalStudentsFemale: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2 flex justify-end gap-4 pt-4">
                  <Button variant="outline" type="button" onClick={() => router.back()}>Back</Button>
                  <Button type="submit" disabled={loading}>Update School</Button>
                </div>
                {error && <p className="md:col-span-2 text-red-500">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 