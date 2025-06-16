import { User, School } from "@/lib/types";
import { HierarchyPermissionManager } from "./hierarchy-permissions";

// This file is used to provide an API for database operations.
// It should be used by client-side components to interact with the database.

export class DatabaseService {
  // =====================================================
  // PROVINCES
  // =====================================================
  static async getProvinces() {
    try {
      const response = await fetch("/api/data/provinces");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    }
  }

  static async getProvincesByCountry(countryId: number | string) {
    try {
      const response = await fetch(`/api/data/provinces?country_id=${countryId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching provinces by country:", error);
      return [];
    }
  }

  // =====================================================
  // DISTRICTS
  // =====================================================
  static async getDistricts() {
    try {
      const response = await fetch("/api/data/districts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  }

  static async getDistrictsByProvince(provinceId: number | string) {
    try {
      const response = await fetch(`/api/data/districts?provinceId=${provinceId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching districts by province:", error);
      return [];
    }
  }

  static async getCommunesByDistrict(districtId: number | string) {
    try {
      const response = await fetch(`/api/data/communes?district_id=${districtId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching communes by district:", error);
      return [];
    }
  }

  static async getVillagesByCommune(communeId: number | string) {
    try {
      const response = await fetch(`/api/data/villages?commune_id=${communeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching villages by commune:", error);
      return [];
    }
  }

  // =====================================================
  // SCHOOLS
  // =====================================================
  static async getSchools(filters: { search?: string; count?: boolean; id?: number; limit?: number; offset?: number; zone?: string; province?: string; status?: number; userId?: number } = {}) {
    try {
      const query = new URLSearchParams();
      if (filters.search) {
        query.append("search", filters.search);
      }
      if (filters.count) {
        query.append("count", "true");
      }
      if (filters.id) {
        query.append("id", filters.id.toString());
      }
      if (filters.limit) {
        query.append("limit", filters.limit.toString());
      }
      if (filters.offset) {
        query.append("offset", filters.offset.toString());
      }
      if (filters.zone) {
        query.append("zone", filters.zone);
      }
      if (filters.province) {
        query.append("province", filters.province);
      }
      if (filters.status !== undefined) {
        query.append("status", filters.status.toString());
      }
      if (filters.userId) {
        query.append("userId", filters.userId.toString());
      }

      const response = await fetch(`/api/data/schools?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching schools:", error);
      return [];
    }
  }

  static async getUniqueZones() {
    try {
      const response = await fetch("/api/data/schools/zones");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching unique zones:", error);
      return [];
    }
  }

  static async getUniqueProvinces() {
    try {
      const response = await fetch("/api/data/schools/provinces");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching unique provinces:", error);
      return [];
    }
  }

  static async getSchoolsByProvince(provinceId: number | string) {
    try {
      const response = await fetch(`/api/data/schools?provinceId=${provinceId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching schools by province:", error);
      return [];
    }
  }

  static async getSchoolsByDistrict(districtId: number | string) {
    try {
      const response = await fetch(`/api/data/schools?districtId=${districtId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching schools by district:", error);
      return [];
    }
  }

  static async createSchool(school: any) {
    try {
      const response = await fetch("/api/data/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(school),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating school:", error);
      return null;
    }
  }

  static async updateSchool(id: number, schoolData: Partial<School>) {
    try {
      const response = await fetch(`/api/data/schools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating school:", error);
      return null;
    }
  }

  static async getSchoolById(id: number) {
    try {
      const response = await fetch(`/api/data/schools/${id}`); // Changed from ?id=${id}
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching school by ID:", error);
      return null;
    }
  }

  // =====================================================
  // USERS
  // =====================================================
  static async getUsers(filters: {
    search?: string
    role?: string
    schoolId?: string
    isActive?: boolean
    startDate?: string
    endDate?: string
    userId?: number
  } = {}) {
    try {
      // Use GET method with query parameters for simpler request
      const queryParams = new URLSearchParams();
      if (filters.search) {
        queryParams.append("search", filters.search);
      }
      if (filters.role) {
        queryParams.append("role", filters.role);
      }
      if (filters.schoolId) {
        queryParams.append("schoolId", filters.schoolId);
      }
      if (filters.isActive !== undefined) {
        queryParams.append("isActive", filters.isActive.toString());
      }
      if (filters.startDate) {
        queryParams.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append("endDate", filters.endDate);
      }
      if (filters.userId) {
        queryParams.append("userId", filters.userId.toString());
      }

      const url = `/api/data/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch users:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: url
        });
        return [];
      }

      const data = await response.json();
      
      // Handle both response formats
      if (data.users && Array.isArray(data.users)) {
        return data.users; // New format with pagination
      } else if (Array.isArray(data)) {
        return data; // Direct array format
      } else {
        console.warn("Unexpected users data format:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      return []; // Return empty array instead of throwing
    }
  }

  static async getUsersBySchool(schoolId: number) {
    try {
      const response = await fetch(`/api/data/users?schoolId=${schoolId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching users by school:", error);
      return [];
    }
  }

  static async createUser(user: any) {
    try {
      const response = await fetch("/api/data/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  }

  static async updateUser(userId: number, userData: any) {
    try {
      const response = await fetch(`/api/data/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async getUserById(userId: number) {
    try {
      const response = await fetch(`/api/data/users/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  static async updatePassword(passwordData: { current_password: string; new_password: string }) {
    try {
      const response = await fetch("/api/data/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }

  static async getUserActivities(userId: number) {
    try {
      const response = await fetch(`/api/data/users/${userId}/activities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user activities:", error);
      return [];
    }
  }

  static async deleteUser(userId: number) {
    try {
      const response = await fetch(`/api/data/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  static async getUserSessions(userId: number) {
    try {
      const response = await fetch(`/api/data/users/${userId}/sessions`)
      if (!response.ok) {
        throw new Error("Failed to fetch user sessions")
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching user sessions:", error)
      throw error
    }
  }

  static async terminateSession(userId: number, sessionId: number) {
    try {
      const response = await fetch(`/api/data/users/${userId}/sessions`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to terminate session")
      }

      return await response.json()
    } catch (error) {
      console.error("Error terminating session:", error)
      throw error
    }
  }

  // =====================================================
  // SURVEYS
  // =====================================================
  static async getSurveys() {
    try {
      const response = await fetch("/api/data/surveys");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching surveys:", error);
      return [];
    }
  }

  static async createSurvey(survey: any) {
    try {
      const response = await fetch("/api/data/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(survey),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating survey:", error);
      return null;
    }
  }

  // =====================================================
  // OBSERVATIONS
  // =====================================================
  static async getObservations(userId?: string) {
    try {
      const url = userId ? `/api/data/observations?userId=${userId}` : "/api/data/observations";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observations:", error);
      return [];
    }
  }

  static async getObservationById(id: number) {
    try {
      const response = await fetch(`/api/data/observations/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observation by ID:", error);
      return null;
    }
  }

  static async getObservationActivities(observationId: number) {
    try {
      const response = await fetch(`/api/data/observation-activities?observationId=${observationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observation activities:", error);
      return [];
    }
  }

  static async getObservationMaterials(observationId: number) {
    try {
      const response = await fetch(`/api/data/observation-materials?observationId=${observationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observation materials:", error);
      return [];
    }
  }

  static async getObservationTarlLevels(observationId: number) {
    try {
      const response = await fetch(`/api/data/observation-tarl-levels?observationId=${observationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observation TaRL levels:", error);
      return [];
    }
  }

  static async getObservationStats(userId?: string) {
    try {
      const url = userId ? `/api/data/observation-stats?userId=${userId}` : "/api/data/observation-stats";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observation stats:", error);
      return [];
    }
  }

  // =====================================================
  // PERMISSIONS & ROLES
  // =====================================================
  static async getRoles(): Promise<Role[]> {
    try {
      const response = await fetch("/api/data/roles");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }

  static async getPages(): Promise<Page[]> {
    try {
      const response = await fetch("/api/data/pages");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching pages:", error);
      return [];
    }
  }

  static async getPermissionMatrix(): Promise<PermissionMatrix[]> {
    try {
      const response = await fetch("/api/data/permissions/matrix");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching permission matrix:", error);
      return [];
    }
  }

  static async updateRolePermissions(data: BulkPermissionUpdate): Promise<boolean> {
    try {
      const response = await fetch("/api/data/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error("Error updating role permissions:", error);
      return false;
    }
  }

  static async checkUserPermission(userId: number, pagePath: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/data/permissions/check?userId=${userId}&pagePath=${encodeURIComponent(pagePath)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.hasAccess;
    } catch (error) {
      console.error("Error checking user permission:", error);
      return false;
    }
  }

  static async getPermissionAuditLog(actionType?: string, entityType?: string, limit: number = 50, offset: number = 0) {
    try {
      const query = new URLSearchParams();
      if (actionType) query.append("actionType", actionType);
      if (entityType) query.append("entityType", entityType);
      query.append("limit", limit.toString());
      query.append("offset", offset.toString());

      const response = await fetch(`/api/audit-trail?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.entries || [];
    } catch (error) {
      console.error("Error fetching permission audit log:", error);
      return [];
    }
  }

  static async setupAuditSystem() {
    try {
      const response = await fetch("/api/setup-audit-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error setting up audit system:", error);
      throw error;
    }
  }

  // =====================================================
  // HIERARCHY MANAGEMENT
  // =====================================================
  
  /**
   * Get user's accessible schools based on hierarchy
   */
  static async getAccessibleSchools(userId: number) {
    try {
      const response = await fetch(`/api/data/hierarchy/schools?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching accessible schools:", error);
      return [];
    }
  }

  /**
   * Get user's accessible students based on hierarchy
   */
  static async getAccessibleStudents(userId: number, filters: { classId?: number; schoolId?: number } = {}) {
    try {
      const query = new URLSearchParams();
      query.append("userId", userId.toString());
      if (filters.classId) {
        query.append("classId", filters.classId.toString());
      }
      if (filters.schoolId) {
        query.append("schoolId", filters.schoolId.toString());
      }

      const response = await fetch(`/api/data/hierarchy/students?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching accessible students:", error);
      return [];
    }
  }

  /**
   * Get teacher's classes
   */
  static async getTeacherClasses(teacherId: number) {
    try {
      const response = await fetch(`/api/data/hierarchy/classes?teacherId=${teacherId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      return [];
    }
  }

  /**
   * Assign user to hierarchy level
   */
  static async assignUserToHierarchy(data: {
    userId: number;
    assignmentType: 'zone' | 'province' | 'district' | 'school' | 'class';
    assignmentId: number;
    assignedBy: number;
  }) {
    try {
      const response = await fetch("/api/data/hierarchy/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error assigning user to hierarchy:", error);
      return null;
    }
  }

  /**
   * Remove user from hierarchy assignment
   */
  static async removeUserFromHierarchy(data: {
    userId: number;
    assignmentType: 'zone' | 'province' | 'district' | 'school' | 'class';
    assignmentId: number;
  }) {
    try {
      const response = await fetch("/api/data/hierarchy/unassign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error removing user from hierarchy:", error);
      return null;
    }
  }

  /**
   * Get user's hierarchy assignments
   */
  static async getUserHierarchyAssignments(userId: number) {
    try {
      const response = await fetch(`/api/data/hierarchy/assignments?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user hierarchy assignments:", error);
      return [];
    }
  }

  /**
   * Create a new class
   */
  static async createClass(classData: {
    class_name: string;
    class_level: number;
    school_id: number;
    teacher_id?: number;
    academic_year: string;
  }) {
    try {
      const response = await fetch("/api/data/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating class:", error);
      return null;
    }
  }

  /**
   * Create a new student
   */
  static async createStudent(studentData: {
    student_id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
    class_id?: number;
    school_id: number;
  }) {
    try {
      const response = await fetch("/api/data/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating student:", error);
      return null;
    }
  }

  /**
   * Update student information
   */
  static async updateStudent(studentId: number, studentData: any) {
    try {
      const response = await fetch(`/api/data/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating student:", error);
      return null;
    }
  }

  /**
   * Get student's monthly transcripts
   */
  static async getStudentTranscripts(studentId: number, filters: { month?: string; year?: string } = {}) {
    try {
      const query = new URLSearchParams();
      if (filters.month) {
        query.append("month", filters.month);
      }
      if (filters.year) {
        query.append("year", filters.year);
      }

      const response = await fetch(`/api/data/students/${studentId}/transcripts?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching student transcripts:", error);
      return [];
    }
  }

  /**
   * Create or update student transcript
   */
  static async saveStudentTranscript(studentId: number, transcriptData: any) {
    try {
      const response = await fetch(`/api/data/students/${studentId}/transcripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transcriptData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error saving student transcript:", error);
      return null;
    }
  }
}