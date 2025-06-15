"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { DatabaseService } from "@/lib/database"
import type { School as SchoolType } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useParams, useRouter } from 'next/navigation'

export default function SchoolDetailsPage() {
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
<<<<<<< HEAD
/*
  if (loading) {
    return <PageLayout title="Loading School..." description="Fetching school details..."><p>Loading school details...</p></PageLayout>;
  }
*/
=======

  if (loading) {
    return <PageLayout title="Loading School..." description="Fetching school details..."><p>Loading school details...</p></PageLayout>;
  }

>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
  if (error) {
    return <PageLayout title="Error" description="Could not load school details."><p className="text-red-500">{error}</p></PageLayout>;
  }

  if (!school) {
    return <PageLayout title="Not Found" description="School details could not be found."><p>School not found or invalid ID.</p></PageLayout>;
  }

<<<<<<< HEAD
  if (school.status !== 1) {
    return (
      <PageLayout title="Not Allowed" description="This school is not active.">
        <p className="text-red-500">This school is not active.</p>
      </PageLayout>
    );
  }

=======
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout title={school.name || "School Details"} description={`Details for ${school.name || "the selected school"}`}>
        <div className="flex flex-col space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{school.name}</CardTitle>
              <CardDescription>Code: {school.code || "N/A"}</CardDescription>
            </CardHeader>
            <CardContent>
<<<<<<< HEAD
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base">
                <div>
                  <span className="block font-semibold mb-2">Zone</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.zoneName || "N/A"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">Province</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.provinceName || "N/A"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">District</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.districtName || "N/A"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">Status</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.status === 1 ? "Active" : "Inactive"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">Total Students</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.totalStudents ?? "N/A"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">Total Teachers</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.totalTeachers ?? "N/A"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">Total Female Teachers</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.totalTeachersFemale ?? "N/A"}</div>
                </div>
                <div>
                  <span className="block font-semibold mb-2">Total Female Students</span>
                  <div className="w-full rounded-lg border px-4 py-3 bg-gray-50">{school.totalStudentsFemale ?? "N/A"}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="md:col-span-2 flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
              <Link href={`/schools/${school.id}/edit`}>
                <Button className={cn(buttonVariants({ variant: "default" }))}>Edit School</Button>
=======
              {/* Tabular alignment using grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <p><strong>Zone:</strong></p>
                <p>{school.zoneName || "N/A"}</p>

                <p><strong>Province:</strong></p>
                <p>{school.provinceName || "N/A"}</p>

                <p><strong>District:</strong></p>
                <p>{school.districtName || "N/A"}</p>

                <p><strong>Cluster:</strong></p>
                <p>{school.cluster || "N/A"}</p>

                <p><strong>Commune:</strong></p>
                <p>{school.commune || "N/A"}</p>

                <p><strong>Status:</strong></p>
                <p>{school.status === 1 ? "Active" : "Inactive"}</p>
              </div>

              {school.image && (
                <div className="mt-4">
                  <p><strong>Image:</strong></p>
                  <img src={school.image} alt="School Image" className="mt-2 max-w-xs" />
                </div>
              )}
            </CardContent>
            
            {/* Edit and Back buttons moved inside the CardFooter */}
            <CardFooter className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Back
              </Button>
              <Link href={`/schools/${school.id}/edit`}>
                <Button className={cn(buttonVariants({ variant: "default" }))}>
                  Edit School
                </Button>
>>>>>>> 7b33594a43002ee4975b28d823c2c907582df8fc
              </Link>
            </CardFooter>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 