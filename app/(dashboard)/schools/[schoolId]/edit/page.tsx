"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { DatabaseService } from "@/lib/database"
import type { School as SchoolType } from "@/lib/types"
import { SchoolForm } from "@/components/school-form"
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

  const handleSuccess = () => {
    router.push(`/schools/${schoolId}`);
  };

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
              <SchoolForm initialData={school} onSuccess={handleSuccess} hideExtraFields={true} />
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Back
              </Button>
              <Button type="submit" form="school-edit-form" disabled={loading}>
                Update School
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 