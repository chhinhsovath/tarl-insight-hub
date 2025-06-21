"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MapPin, 
  School, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  Search,
  Building,
  Users,
  Calendar,
  Globe,
  BookOpen,
  Wifi,
  Zap,
  WaterDrop
} from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { useGlobalLoading } from "@/lib/global-loading-context";
import { DemographicDropdowns } from "@/components/demographic-dropdowns";
import { PageHeader } from "@/components/ui/page-header";

interface School {
  sclAutoID: number;
  sclCode: string;
  sclName: string;
  sclZoneName: string;
  sclProvinceName: string;
  sclDistrictName: string;
  sclCommuneName: string;
  sclVillageName: string;
  sclStatus: number;
}

interface SchoolDetails {
  // Basic Information
  schoolType: string;
  schoolLevel: string;
  establishedYear: string;
  totalClasses: string;
  totalStudents: string;
  totalTeachers: string;
  
  // Infrastructure
  buildingCondition: string;
  classroomCount: string;
  toiletCount: string;
  libraryAvailable: string;
  computerLabAvailable: string;
  internetAvailable: string;
  electricityAvailable: string;
  waterSourceAvailable: string;
  
  // Director Information
  directorName: string;
  directorGender: string;
  directorAge: string;
  directorPhone: string;
  directorEmail: string;
  directorEducation: string;
  directorExperience: string;
  
  // Contact & Location
  schoolPhone: string;
  schoolEmail: string;
  latitude: string;
  longitude: string;
  
  // Additional Information
  challenges: string;
  achievements: string;
  supportNeeded: string;
  notes: string;
}

export default function SchoolRegistrationPage() {
  const { language } = useGlobalLanguage();
  const { showLoading, hideLoading } = useGlobalLoading();
  const isKhmer = language === 'kh';
  
  // School Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState<SchoolDetails>({
    schoolType: "",
    schoolLevel: "",
    establishedYear: "",
    totalClasses: "",
    totalStudents: "",
    totalTeachers: "",
    buildingCondition: "",
    classroomCount: "",
    toiletCount: "",
    libraryAvailable: "",
    computerLabAvailable: "",
    internetAvailable: "",
    electricityAvailable: "",
    waterSourceAvailable: "",
    directorName: "",
    directorGender: "",
    directorAge: "",
    directorPhone: "",
    directorEmail: "",
    directorEducation: "",
    directorExperience: "",
    schoolPhone: "",
    schoolEmail: "",
    latitude: "",
    longitude: "",
    challenges: "",
    achievements: "",
    supportNeeded: "",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
  }, []);

  // Filter schools based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSchools([]);
      return;
    }

    const filtered = schools.filter(school => 
      school.sclName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.sclCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.sclProvinceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.sclDistrictName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSchools(filtered.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, schools]);

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      const response = await fetch('/api/data/schools?limit=1000', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchools(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading schools:", error);
      toast.error(isKhmer ? "មិនអាចផ្ទុកបញ្ជីសាលាបានទេ" : "Failed to load schools list");
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSearchTerm(school.sclName);
    setFilteredSchools([]);
    
    // Auto-fill some basic information
    setFormData(prev => ({
      ...prev,
      // Reset form but keep any previously entered data
    }));
  };

  const handleInputChange = (field: keyof SchoolDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(isKhmer ? "ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ទេ" : "Your device doesn't support GPS location");
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        setLocationLoading(false);
        toast.success(isKhmer ? "ទីតាំង GPS ត្រូវបានរកឃើញ" : "GPS location captured successfully");
      },
      (error) => {
        setLocationLoading(false);
        toast.error(isKhmer ? "មិនអាចរកទីតាំង GPS បានទេ" : "Could not get GPS location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [isKhmer]);

  const validateForm = () => {
    if (!selectedSchool) {
      toast.error(isKhmer ? "សូមជ្រើសរើសសាលា" : "Please select a school");
      return false;
    }

    const required = [
      { field: formData.directorName, name: isKhmer ? "ឈ្មោះនាយកសាលា" : "Director Name" },
      { field: formData.directorPhone, name: isKhmer ? "លេខទូរស័ព្ទនាយកសាលា" : "Director Phone" },
      { field: formData.schoolType, name: isKhmer ? "ប្រភេទសាលា" : "School Type" },
      { field: formData.schoolLevel, name: isKhmer ? "កម្រិតសាលា" : "School Level" }
    ];

    for (const item of required) {
      if (!item.field?.trim()) {
        toast.error(`${isKhmer ? "សូមបញ្ចូល" : "Please enter"} ${item.name}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    showLoading("Submitting registration...");
    
    try {
      const response = await fetch("/api/school-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId: selectedSchool?.sclAutoID,
          schoolData: formData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(isKhmer ? "ការចុះឈ្មោះត្រូវបានដាក់ស្នើរួចរាល់" : "Registration submitted successfully");
      } else {
        toast.error(result.error || (isKhmer ? "មានបញ្ហាក្នុងការចុះឈ្មោះ" : "Registration failed"));
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(isKhmer ? "មានបញ្ហាក្នុងការទាក់ទងម៉ាស៊ីនមេ" : "Network error occurred");
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={isKhmer ? "ការចុះឈ្មោះបានជោគជ័យ" : "Registration Successful"}
          description={isKhmer ? "ការស្នើសុំត្រូវបានដាក់ស្នើរួចរាល់" : "Your registration request has been submitted"}
          icon={CheckCircle}
        />
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">
              {isKhmer ? "ការចុះឈ្មោះបានជោគជ័យ" : "Registration Successful"}
            </CardTitle>
            <CardDescription>
              {isKhmer 
                ? "ការស្នើសុំចុះឈ្មោះសាលារបស់អ្នកកំពុងចាំការអនុម័តពីអ្នកគ្រប់គ្រងប្រព័ន្ធ"
                : "Your school registration request is pending approval from system administrators"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {isKhmer 
                ? "នាយកសាលានឹងទទួលបានលិខិតបញ្ជាក់នៅពេលសាលាត្រូវបានអនុម័ត"
                : "The director will receive confirmation credentials once the school is approved"
              }
            </p>
            <Button onClick={() => window.location.href = "/dashboard"} className="w-full">
              {isKhmer ? "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង" : "Back to Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isKhmer ? "ការចុះឈ្មោះសាលារៀន" : "School Registration"}
        description={isKhmer ? "បំពេញព័ត៌មានលម្អិតរបស់សាលា" : "Complete comprehensive school information"}
        icon={School}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Management" },
          { label: isKhmer ? "ចុះឈ្មោះសាលា" : "School Registration" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School Search & Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {isKhmer ? "ស្វែងរកនិងជ្រើសរើសសាលា" : "Search & Select School"}
            </CardTitle>
            <CardDescription>
              {isKhmer ? "ស្វែងរកសាលាពីបញ្ជីសាលាដែលមានស្រាប់" : "Search for a school from the existing schools database"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={isKhmer ? "ស្វែងរកតាមឈ្មោះសាលា ឬលេខកូដ..." : "Search by school name or code..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {filteredSchools.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredSchools.map((school) => (
                  <div
                    key={school.sclAutoID}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSchoolSelect(school)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{school.sclName}</h4>
                        <p className="text-sm text-gray-500">
                          Code: {school.sclCode} | {school.sclProvinceName}, {school.sclDistrictName}
                        </p>
                      </div>
                      <Badge variant={school.sclStatus === 1 ? "default" : "secondary"}>
                        {school.sclStatus === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected School */}
            {selectedSchool && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">{selectedSchool.sclName}</h4>
                    <p className="text-sm text-blue-700">
                      {selectedSchool.sclCode} | {selectedSchool.sclVillageName}, {selectedSchool.sclCommuneName}, {selectedSchool.sclDistrictName}, {selectedSchool.sclProvinceName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSchool(null);
                      setSearchTerm("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedSchool && (
          <>
            {/* Basic School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានមូលដ្ឋានសាលា" : "Basic School Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="schoolType">
                      {isKhmer ? "ប្រភេទសាលា" : "School Type"} *
                    </Label>
                    <Select value={formData.schoolType} onValueChange={(value) => handleInputChange("schoolType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "ជ្រើសរើសប្រភេទ" : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">{isKhmer ? "សាលារដ្ឋ" : "Public"}</SelectItem>
                        <SelectItem value="private">{isKhmer ? "សាលាឯកជន" : "Private"}</SelectItem>
                        <SelectItem value="community">{isKhmer ? "សាលាសហគមន៍" : "Community"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="schoolLevel">
                      {isKhmer ? "កម្រិតសាលា" : "School Level"} *
                    </Label>
                    <Select value={formData.schoolLevel} onValueChange={(value) => handleInputChange("schoolLevel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "ជ្រើសរើសកម្រិត" : "Select level"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">{isKhmer ? "បឋមសិក្សា" : "Primary"}</SelectItem>
                        <SelectItem value="secondary">{isKhmer ? "មធ្យមសិក្សា" : "Secondary"}</SelectItem>
                        <SelectItem value="high">{isKhmer ? "វិទ្យាល័យ" : "High School"}</SelectItem>
                        <SelectItem value="mixed">{isKhmer ? "បញ្រុំ" : "Mixed Levels"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="establishedYear">
                      {isKhmer ? "ឆ្នាំបង្កើត" : "Established Year"}
                    </Label>
                    <Input
                      id="establishedYear"
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                      placeholder={isKhmer ? "ឆ្នាំបង្កើតសាលា" : "Year school was established"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="totalClasses">
                      {isKhmer ? "ចំនួនថ្នាក់សរុប" : "Total Classes"}
                    </Label>
                    <Input
                      id="totalClasses"
                      type="number"
                      value={formData.totalClasses}
                      onChange={(e) => handleInputChange("totalClasses", e.target.value)}
                      placeholder={isKhmer ? "ចំនួនថ្នាក់" : "Number of classes"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalStudents">
                      {isKhmer ? "ចំនួនសិស្សសរុប" : "Total Students"}
                    </Label>
                    <Input
                      id="totalStudents"
                      type="number"
                      value={formData.totalStudents}
                      onChange={(e) => handleInputChange("totalStudents", e.target.value)}
                      placeholder={isKhmer ? "ចំនួនសិស្ស" : "Number of students"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalTeachers">
                      {isKhmer ? "ចំនួនគ្រូសរុប" : "Total Teachers"}
                    </Label>
                    <Input
                      id="totalTeachers"
                      type="number"
                      value={formData.totalTeachers}
                      onChange={(e) => handleInputChange("totalTeachers", e.target.value)}
                      placeholder={isKhmer ? "ចំនួនគ្រូ" : "Number of teachers"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានហេដ្ឋារចនាសម្ព័ន្ធ" : "Infrastructure Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buildingCondition">
                      {isKhmer ? "ស្ថានភាពអគារ" : "Building Condition"}
                    </Label>
                    <Select value={formData.buildingCondition} onValueChange={(value) => handleInputChange("buildingCondition", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "ជ្រើសរើសស្ថានភាព" : "Select condition"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">{isKhmer ? "ល្អបំផុត" : "Excellent"}</SelectItem>
                        <SelectItem value="good">{isKhmer ? "ល្អ" : "Good"}</SelectItem>
                        <SelectItem value="fair">{isKhmer ? "មធ្យម" : "Fair"}</SelectItem>
                        <SelectItem value="poor">{isKhmer ? "ខ្សោយ" : "Poor"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classroomCount">
                      {isKhmer ? "ចំនួនបន្ទប់រៀន" : "Number of Classrooms"}
                    </Label>
                    <Input
                      id="classroomCount"
                      type="number"
                      value={formData.classroomCount}
                      onChange={(e) => handleInputChange("classroomCount", e.target.value)}
                      placeholder={isKhmer ? "ចំនួនបន្ទប់រៀន" : "Classroom count"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="toiletCount">
                      {isKhmer ? "ចំនួនបង្គន់" : "Toilets"}
                    </Label>
                    <Input
                      id="toiletCount"
                      type="number"
                      value={formData.toiletCount}
                      onChange={(e) => handleInputChange("toiletCount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="libraryAvailable">
                      {isKhmer ? "បណ្ណាល័យ" : "Library"}
                    </Label>
                    <Select value={formData.libraryAvailable} onValueChange={(value) => handleInputChange("libraryAvailable", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "មាន/គ្មាន" : "Yes/No"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{isKhmer ? "មាន" : "Yes"}</SelectItem>
                        <SelectItem value="no">{isKhmer ? "គ្មាន" : "No"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="computerLabAvailable">
                      {isKhmer ? "បន្ទប់កុំព្យូទ័រ" : "Computer Lab"}
                    </Label>
                    <Select value={formData.computerLabAvailable} onValueChange={(value) => handleInputChange("computerLabAvailable", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "មាន/គ្មាន" : "Yes/No"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{isKhmer ? "មាន" : "Yes"}</SelectItem>
                        <SelectItem value="no">{isKhmer ? "គ្មាន" : "No"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="internetAvailable">
                      <Wifi className="w-4 h-4 inline mr-1" />
                      {isKhmer ? "អ៊ីនធឺណិត" : "Internet"}
                    </Label>
                    <Select value={formData.internetAvailable} onValueChange={(value) => handleInputChange("internetAvailable", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "មាន/គ្មាន" : "Yes/No"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{isKhmer ? "មាន" : "Yes"}</SelectItem>
                        <SelectItem value="no">{isKhmer ? "គ្មាន" : "No"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="electricityAvailable">
                      <Zap className="w-4 h-4 inline mr-1" />
                      {isKhmer ? "អគ្គិសនី" : "Electricity"}
                    </Label>
                    <Select value={formData.electricityAvailable} onValueChange={(value) => handleInputChange("electricityAvailable", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "មាន/គ្មាន" : "Yes/No"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{isKhmer ? "មាន" : "Yes"}</SelectItem>
                        <SelectItem value="no">{isKhmer ? "គ្មាន" : "No"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="waterSourceAvailable">
                      <WaterDrop className="w-4 h-4 inline mr-1" />
                      {isKhmer ? "ប្រភពទឹកស្អាត" : "Clean Water"}
                    </Label>
                    <Select value={formData.waterSourceAvailable} onValueChange={(value) => handleInputChange("waterSourceAvailable", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "មាន/គ្មាន" : "Yes/No"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{isKhmer ? "មាន" : "Yes"}</SelectItem>
                        <SelectItem value="no">{isKhmer ? "គ្មាន" : "No"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Director Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មាននាយកសាលា" : "Director Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="directorName">
                      {isKhmer ? "ឈ្មោះនាយកសាលា" : "Director Name"} *
                    </Label>
                    <Input
                      id="directorName"
                      value={formData.directorName}
                      onChange={(e) => handleInputChange("directorName", e.target.value)}
                      placeholder={isKhmer ? "បញ្ចូលឈ្មោះនាយកសាលា" : "Enter director name"}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="directorGender">
                      {isKhmer ? "ភេទ" : "Gender"}
                    </Label>
                    <Select value={formData.directorGender} onValueChange={(value) => handleInputChange("directorGender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "ជ្រើសរើសភេទ" : "Select gender"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{isKhmer ? "ប្រុស" : "Male"}</SelectItem>
                        <SelectItem value="Female">{isKhmer ? "ស្រី" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="directorAge">
                      {isKhmer ? "អាយុ" : "Age"}
                    </Label>
                    <Input
                      id="directorAge"
                      type="number"
                      value={formData.directorAge}
                      onChange={(e) => handleInputChange("directorAge", e.target.value)}
                      placeholder={isKhmer ? "បញ្ចូលអាយុ" : "Enter age"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="directorPhone">
                      {isKhmer ? "លេខទូរស័ព្ទ" : "Phone Number"} *
                    </Label>
                    <Input
                      id="directorPhone"
                      value={formData.directorPhone}
                      onChange={(e) => handleInputChange("directorPhone", e.target.value)}
                      placeholder={isKhmer ? "បញ្ចូលលេខទូរស័ព្ទ" : "Enter phone number"}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="directorEmail">
                      {isKhmer ? "អ៊ីមែល" : "Email"}
                    </Label>
                    <Input
                      id="directorEmail"
                      type="email"
                      value={formData.directorEmail}
                      onChange={(e) => handleInputChange("directorEmail", e.target.value)}
                      placeholder={isKhmer ? "បញ្ចូលអ៊ីមែល" : "Enter email"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="directorEducation">
                      {isKhmer ? "កម្រិតវប្បធម៌" : "Education Level"}
                    </Label>
                    <Select value={formData.directorEducation} onValueChange={(value) => handleInputChange("directorEducation", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isKhmer ? "ជ្រើសរើសកម្រិតវប្បធម៌" : "Select education level"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelor">{isKhmer ? "បរិញ្ញាបត្រ" : "Bachelor's Degree"}</SelectItem>
                        <SelectItem value="master">{isKhmer ? "អនុបណ្ឌិត" : "Master's Degree"}</SelectItem>
                        <SelectItem value="doctorate">{isKhmer ? "បណ្ឌិត" : "Doctorate"}</SelectItem>
                        <SelectItem value="other">{isKhmer ? "ផ្សេងទៀត" : "Other"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="directorExperience">
                      {isKhmer ? "បទពិសោធន៍ការងារ (ឆ្នាំ)" : "Work Experience (Years)"}
                    </Label>
                    <Input
                      id="directorExperience"
                      type="number"
                      value={formData.directorExperience}
                      onChange={(e) => handleInputChange("directorExperience", e.target.value)}
                      placeholder={isKhmer ? "ចំនួនឆ្នាំបទពិសោធន៍" : "Years of experience"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានទំនាក់ទំនងនិងទីតាំង" : "Contact & Location Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolPhone">
                      {isKhmer ? "លេខទូរស័ព្ទសាលា" : "School Phone Number"}
                    </Label>
                    <Input
                      id="schoolPhone"
                      value={formData.schoolPhone}
                      onChange={(e) => handleInputChange("schoolPhone", e.target.value)}
                      placeholder={isKhmer ? "លេខទូរស័ព្ទសាលា" : "School phone number"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolEmail">
                      {isKhmer ? "អ៊ីមែលសាលា" : "School Email"}
                    </Label>
                    <Input
                      id="schoolEmail"
                      type="email"
                      value={formData.schoolEmail}
                      onChange={(e) => handleInputChange("schoolEmail", e.target.value)}
                      placeholder={isKhmer ? "អ៊ីមែលសាលា" : "School email address"}
                    />
                  </div>
                </div>

                {/* GPS Location */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">
                      {isKhmer ? "ទីតាំង GPS" : "GPS Location"}
                    </Label>
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      variant="outline"
                      size="sm"
                    >
                      {locationLoading ? (
                        isKhmer ? "កំពុងស្វែងរក..." : "Getting location..."
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          {isKhmer ? "ចាប់យកទីតាំង" : "Get Location"}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">
                        {isKhmer ? "រយៈទទឹង" : "Latitude"}
                      </Label>
                      <Input
                        id="latitude"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange("latitude", e.target.value)}
                        placeholder="0.000000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">
                        {isKhmer ? "រយៈបណ្តោយ" : "Longitude"}
                      </Label>
                      <Input
                        id="longitude"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange("longitude", e.target.value)}
                        placeholder="0.000000"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានបន្ថែម" : "Additional Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="challenges">
                    {isKhmer ? "បញ្ហាប្រឈមសំខាន់ៗ" : "Main Challenges"}
                  </Label>
                  <Textarea
                    id="challenges"
                    value={formData.challenges}
                    onChange={(e) => handleInputChange("challenges", e.target.value)}
                    placeholder={isKhmer ? "បញ្ចូលបញ្ហាប្រឈមសំខាន់ៗ..." : "Describe main challenges faced by the school..."}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="achievements">
                    {isKhmer ? "សមិទ្ធផលសំខាន់ៗ" : "Key Achievements"}
                  </Label>
                  <Textarea
                    id="achievements"
                    value={formData.achievements}
                    onChange={(e) => handleInputChange("achievements", e.target.value)}
                    placeholder={isKhmer ? "បញ្ចូលសមិទ្ធផលសំខាន់ៗ..." : "Describe key achievements and successes..."}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="supportNeeded">
                    {isKhmer ? "ជំនួយដែលត្រូវការ" : "Support Needed"}
                  </Label>
                  <Textarea
                    id="supportNeeded"
                    value={formData.supportNeeded}
                    onChange={(e) => handleInputChange("supportNeeded", e.target.value)}
                    placeholder={isKhmer ? "បញ្ចូលជំនួយដែលត្រូវការ..." : "Describe what support is needed..."}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">
                    {isKhmer ? "កំណត់ចំណាំបន្ថែម" : "Additional Notes"}
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder={isKhmer ? "បញ្ចូលកំណត់ចំណាំបន្ថែម..." : "Enter additional notes..."}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 text-lg"
                size="lg"
              >
                {loading ? (
                  isKhmer ? "កំពុងដាក់ស្នើ..." : "Submitting..."
                ) : (
                  isKhmer ? "ដាក់ស្នើចុះឈ្មោះ" : "Submit Registration"
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}