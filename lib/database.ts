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

  // =====================================================
  // SCHOOLS
  // =====================================================
  static async getSchools() {
    try {
      const response = await fetch("/api/data/schools");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching schools:", error);
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

  // =====================================================
  // USERS
  // =====================================================
  static async getUsers() {
    try {
      const response = await fetch("/api/data/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
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
      const response = await fetch(`/api/data/observations/${observationId}/activities`);
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
      const response = await fetch(`/api/data/observations/${observationId}/materials`);
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
      const response = await fetch(`/api/data/observations/${observationId}/tarl-levels`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching observation Tarl levels:", error);
      return [];
    }
  }

  static async getObservationStats(userId?: string) {
    try {
      const url = userId ? `/api/data/observations/stats?userId=${userId}` : "/api/data/observations/stats";
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
  // LEARNING PROGRESS
  // =====================================================
  static async getLearningProgressSummary(filters: any = {}) {
    try {
      const params = new URLSearchParams();
      for (const key in filters) {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      }
      const url = `/api/data/learning-progress?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching learning progress summary:", error);
      return [];
    }
  }

  // =====================================================
  // STUDENTS
  // =====================================================
  static async getStudents() {
    try {
      const response = await fetch("/api/data/students");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching students:", error);
      return [];
    }
  }

  static async createStudent(student: any) {
    try {
      const response = await fetch("/api/data/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
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

  // =====================================================
  // SUBJECTS
  // =====================================================
  static async getSubjects() {
    try {
      const response = await fetch("/api/data/subjects");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }
  }

  // =====================================================
  // TRAINING FEEDBACK
  // =====================================================
  static async getTrainingFeedback() {
    try {
      const response = await fetch("/api/data/training-feedback");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching training feedback:", error);
      return [];
    }
  }

  static async createTrainingFeedback(feedback: any) {
    try {
      const response = await fetch("/api/data/training-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating training feedback:", error);
      return null;
    }
  }

  // =====================================================
  // SURVEY ANALYTICS
  // =====================================================
  static async getSurveyAnalytics() {
    try {
      const response = await fetch("/api/data/survey-analytics");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching survey analytics:", error);
      return [];
    }
  }

  // =====================================================
  // DASHBOARD STATS
  // =====================================================
  static async getDashboardStats(filters: any = {}) {
    try {
      const params = new URLSearchParams();
      for (const key in filters) {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      }
      const url = `/api/data/dashboard-stats?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return null;
    }
  }

  // =====================================================
  // Schools with Details
  // =====================================================
  static async getSchoolsWithDetails() {
    try {
      const response = await fetch("/api/data/schools-with-details");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching schools with details:", error);
      return [];
    }
  }

  // =====================================================
  // Users with Details
  // =====================================================
  static async getUsersWithDetails() {
    try {
      const response = await fetch("/api/data/users-with-details");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching users with details:", error);
      return [];
    }
  }

  // =====================================================
  // Check Tables Exist
  // =====================================================
  static async checkTablesExist(tableNames?: string[]) {
    try {
      const url = tableNames ? `/api/data/check-tables-exist?tableNames=${tableNames.join(',')}` : "/api/data/check-tables-exist";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error checking tables existence:", error);
      return false;
    }
  }

  // =====================================================
  // Survey Responses
  // =====================================================
  static async getSurveyResponses(surveyId?: number) {
    try {
      const url = surveyId ? `/api/data/survey-responses?surveyId=${surveyId}` : "/api/data/survey-responses";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching survey responses:", error);
      return [];
    }
  }

  static async createSurveyResponse(surveyResponse: any) {
    try {
      const response = await fetch("/api/data/survey-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyResponse),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating survey response:", error);
      return null;
    }
  }
}
