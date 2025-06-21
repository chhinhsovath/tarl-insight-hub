"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FlowbiteDataTable } from "@/components/ui/flowbite-data-table";
import { FlowbiteButton } from "@/components/ui/flowbite-button";
import { StatCard } from "@/components/ui/stat-card";
import { DatabaseService } from "@/lib/database";
import { School } from "@/lib/types";
import { useGlobalLoading } from "@/lib/global-loading-context";
import { 
  Building, 
  MapPin, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Download
} from "lucide-react";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    provinces: 0,
    avgStudents: 0,
    totalStudents: 0,
  });
  
  const { showLoading, hideLoading } = useGlobalLoading();

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      showLoading("Loading schools...");
      const data = await DatabaseService.getSchools();
      const schoolsArray = Array.isArray(data) ? data : [];
      setSchools(schoolsArray);
      
      // Calculate stats
      const totalStudents = schoolsArray.reduce((sum, school) => sum + (school.total_students || 0), 0);
      const provinces = new Set(schoolsArray.map(s => s.province_name)).size;
      
      setStats({
        total: schoolsArray.length,
        provinces,
        avgStudents: Math.round(totalStudents / schoolsArray.length) || 0,
        totalStudents,
      });
    } catch (error) {
      console.error("Error loading schools:", error);
      setSchools([]); // Fallback to empty array
    } finally {
      hideLoading();
    }
  };

  const columns = [
    {
      key: "name",
      label: "School Name",
      sortable: true,
      render: (value: string, row: School) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 dark:bg-blue-900/50">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      sortable: true,
      render: (_: any, row: School) => (
        <div className="flex items-start text-gray-900 dark:text-white">
          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium">{row.village_name || "N/A"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.commune_name}, {row.district_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "province_name",
      label: "Province",
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          {value || "N/A"}
        </span>
      ),
    },
    {
      key: "total_students",
      label: "Students",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {value?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const pageActions = (
    <div className="flex items-center space-x-3">
      <FlowbiteButton
        variant="secondary"
        size="sm"
        icon={Download}
        iconPosition="left"
      >
        Export
      </FlowbiteButton>
      <FlowbiteButton
        variant="primary"
        size="sm"
        icon={Plus}
        iconPosition="left"
      >
        Add School
      </FlowbiteButton>
    </div>
  );


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Schools Management"
        description="Manage and monitor all schools in the TaRL system"
        icon={Building}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Management" },
          { label: "Schools" },
        ]}
        actions={pageActions}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Schools"
          value={stats.total}
          change="12%"
          changeType="increase"
          icon={Building}
          color="blue"
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          change="8%"
          changeType="increase"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Provinces Covered"
          value={stats.provinces}
          icon={MapPin}
          color="purple"
        />
        <StatCard
          title="Avg Students/School"
          value={stats.avgStudents}
          change="5%"
          changeType="decrease"
          icon={Users}
          color="orange"
        />
      </div>

      {/* Schools Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
        <FlowbiteDataTable
          data={schools}
          columns={columns}
          title="Schools"
          searchPlaceholder="Search schools by name, location, or province..."
          pageName="schools"
          createUrl="/schools/new"
          bulkActions={true}
          onRowClick={(school) => {
            console.log("Clicked school:", school);
            // Navigate to school details
          }}
        />
      </div>

      {/* Quick Stats by Province */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Schools by Province
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(
            (schools || []).reduce((acc, school) => {
              const province = school.province_name || "Unknown";
              if (!acc[province]) acc[province] = 0;
              acc[province]++;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([province, count]) => (
              <div
                key={province}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {province}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {count}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}