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

  if (loading) {
    return <PageLayout title="Loading School..." description="Fetching school details..."><p>Loading school details...</p></PageLayout>;
  }

  if (error) {
    return <PageLayout title="Error" description="Could not load school details."><p className="text-red-500">{error}</p></PageLayout>;
  }

  if (!school) {
    return <PageLayout title="Not Found" description="School details could not be found."><p>School not found or invalid ID.</p></PageLayout>;
  }

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
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <p><strong>Zone:</strong></p>
                <p>{school.zoneName || "N/A"}</p>
                <p><strong>Province:</strong></p>
                <p>{school.provinceName || "N/A"}</p>
                <p><strong>District:</strong></p>
                <p>{school.districtName || "N/A"}</p>
                <p><strong>Status:</strong></p>
                <p>{school.status === 1 ? "Active" : "Inactive"}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
              <Link href={`/schools/${school.id}/edit`}>
                <Button className={cn(buttonVariants({ variant: "default" }))}>Edit School</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 