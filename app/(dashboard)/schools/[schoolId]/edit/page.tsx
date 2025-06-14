"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { DatabaseService } from "@/lib/database"
import type { School as SchoolType } from "@/lib/types"
import { ProtectedRoute } from "@/components/protected-route"
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
                    });
                    if (updated) router.push(`/schools/${school.id}`);
                  } catch (err) {
                    setError("Failed to update school.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="name">School Name</label>
                  <input id="name" value={school.name || ""} onChange={e => setSchool({ ...school, name: e.target.value })} required className="input" />
                </div>
                <div>
                  <label htmlFor="code">School Code</label>
                  <input id="code" value={school.code || ""} onChange={e => setSchool({ ...school, code: e.target.value })} className="input" />
                </div>
                <div>
                  <label htmlFor="zoneName">Zone</label>
                  <input id="zoneName" value={school.zoneName || ""} onChange={e => setSchool({ ...school, zoneName: e.target.value })} className="input" />
                </div>
                <div>
                  <label htmlFor="provinceName">Province</label>
                  <input id="provinceName" value={school.provinceName || ""} onChange={e => setSchool({ ...school, provinceName: e.target.value })} className="input" />
                </div>
                <div>
                  <label htmlFor="districtName">District</label>
                  <input id="districtName" value={school.districtName || ""} onChange={e => setSchool({ ...school, districtName: e.target.value })} className="input" />
                </div>
                <div>
                  <label htmlFor="status">Status</label>
                  <select id="status" value={school.status} onChange={e => setSchool({ ...school, status: Number(e.target.value) })} className="input">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" type="button" onClick={() => router.back()}>Back</Button>
                  <Button type="submit" disabled={loading}>Update School</Button>
                </div>
                {error && <p className="text-red-500">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 