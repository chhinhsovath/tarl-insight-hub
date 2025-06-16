"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { DatabaseService } from "@/lib/database"
import type { School as SchoolType } from "@/lib/types"
import { ProtectedRoute } from "@/components/protected-route"
import { useParams } from 'next/navigation'

export default function SchoolDetailsPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    const fetchSchool = async () => {
      try {
        setLoading(true);
        const schoolData = await DatabaseService.getSchoolById(Number(schoolId));
        if (schoolData) {
          setSchool(schoolData);
        } else {
          setError("School not found");
        }
      } catch (err) {
        console.error('Error fetching school:', err);
        setError('Failed to load school data');
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
      <PageLayout title={school.name} description="School Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <p><strong>School Code:</strong> {school.code || 'N/A'}</p>
              <p><strong>Status:</strong> {school.status === 1 ? 'Active' : 'Inactive'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">Location</h3>
              <p><strong>Zone:</strong> {school.zoneName || 'N/A'}</p>
              <p><strong>Province:</strong> {school.provinceName || 'N/A'}</p>
              <p><strong>District:</strong> {school.districtName || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Statistics</h3>
              <p><strong>Total Students:</strong> {school.totalStudents || 0}</p>
              <p><strong>Female Students:</strong> {school.totalStudentsFemale || 0}</p>
              <p><strong>Total Teachers:</strong> {school.totalTeachers || 0}</p>
              <p><strong>Female Teachers:</strong> {school.totalTeachersFemale || 0}</p>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}