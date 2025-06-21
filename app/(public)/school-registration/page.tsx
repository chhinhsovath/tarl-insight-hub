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
  WaterDrop,
  ArrowLeft
} from "lucide-react";
import { DemographicDropdowns } from "@/components/demographic-dropdowns";

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

export default function PublicSchoolRegistrationPage() {
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
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchools(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading schools:", error);
      toast.error("Failed to load schools list");
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSearchTerm(school.sclName);
    setFilteredSchools([]);
  };

  const handleInputChange = (field: keyof SchoolDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Your device doesn't support GPS location");
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
        toast.success("GPS location captured successfully");
      },
      (error) => {
        setLocationLoading(false);
        toast.error("Could not get GPS location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  const validateForm = () => {
    if (!selectedSchool) {
      toast.error("Please select a school");
      return false;
    }

    const required = [
      { field: formData.directorName, name: "Director Name" },
      { field: formData.directorPhone, name: "Director Phone" },
      { field: formData.schoolType, name: "School Type" },
      { field: formData.schoolLevel, name: "School Level" }
    ];

    for (const item of required) {
      if (!item.field?.trim()) {
        toast.error(`Please enter ${item.name}`);
        return false;
      }
    }

    if (formData.directorEmail && !/\S+@\S+\.\S+/.test(formData.directorEmail)) {
      toast.error("Invalid email format");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
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
        toast.success("Registration submitted successfully");
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600 text-2xl">
              Registration Successful
            </CardTitle>
            <CardDescription className="text-lg">
              Your school registration request has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">
                What happens next?
              </p>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>• Your registration is now pending approval</li>
                <li>• System administrators will review your submission</li>
                <li>• You will receive confirmation once approved</li>
                <li>• Access credentials will be provided via email/phone</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = "/"} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                className="flex items-center gap-2"
              >
                <School className="w-4 h-4" />
                Register Another School
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <School className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              School Registration
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete comprehensive information about your school to join the TaRL Insight Hub system
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
              <Users className="w-4 h-4" />
              For School Directors and Administrators
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* School Search & Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-6 w-6" />
                  Find Your School
                </CardTitle>
                <CardDescription>
                  Search for your school from our database of registered schools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by school name, code, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-lg py-3"
                  />
                </div>

                {/* Search Results */}
                {filteredSchools.length > 0 && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto bg-white">
                    {filteredSchools.map((school) => (
                      <div
                        key={school.sclAutoID}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => handleSchoolSelect(school)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{school.sclName}</h4>
                            <p className="text-gray-600 mt-1">
                              <span className="font-medium">Code:</span> {school.sclCode}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              📍 {school.sclVillageName}, {school.sclCommuneName}, {school.sclDistrictName}, {school.sclProvinceName}
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
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 text-xl">{selectedSchool.sclName}</h4>
                        <p className="text-blue-700 mt-1">
                          <span className="font-medium">School Code:</span> {selectedSchool.sclCode}
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          📍 {selectedSchool.sclVillageName}, {selectedSchool.sclCommuneName}, {selectedSchool.sclDistrictName}, {selectedSchool.sclProvinceName}
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
                        Change School
                      </Button>
                    </div>
                  </div>
                )}

                {searchTerm && filteredSchools.length === 0 && !loadingSchools && (
                  <div className="text-center py-8 text-gray-500">
                    <School className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No schools found matching "{searchTerm}"</p>
                    <p className="text-sm mt-1">Try searching with different keywords or contact support</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedSchool && (
              <>
                {/* Basic School Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <School className="h-6 w-6" />
                      Basic School Information
                    </CardTitle>
                    <CardDescription>
                      Provide essential details about your school
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="schoolType" className="text-base font-medium">
                          School Type *
                        </Label>
                        <Select value={formData.schoolType} onValueChange={(value) => handleInputChange("schoolType", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select school type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public School</SelectItem>
                            <SelectItem value="private">Private School</SelectItem>
                            <SelectItem value="community">Community School</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="schoolLevel" className="text-base font-medium">
                          School Level *
                        </Label>
                        <Select value={formData.schoolLevel} onValueChange={(value) => handleInputChange("schoolLevel", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select school level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary School</SelectItem>
                            <SelectItem value="secondary">Secondary School</SelectItem>
                            <SelectItem value="high">High School</SelectItem>
                            <SelectItem value="mixed">Mixed Levels</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="establishedYear" className="text-base font-medium">
                          Established Year
                        </Label>
                        <Input
                          id="establishedYear"
                          type="number"
                          value={formData.establishedYear}
                          onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                          placeholder="Year school was established"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="totalClasses" className="text-base font-medium">
                          Total Classes
                        </Label>
                        <Input
                          id="totalClasses"
                          type="number"
                          value={formData.totalClasses}
                          onChange={(e) => handleInputChange("totalClasses", e.target.value)}
                          placeholder="Number of classes"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="totalStudents" className="text-base font-medium">
                          Total Students
                        </Label>
                        <Input
                          id="totalStudents"
                          type="number"
                          value={formData.totalStudents}
                          onChange={(e) => handleInputChange("totalStudents", e.target.value)}
                          placeholder="Number of students"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="totalTeachers" className="text-base font-medium">
                          Total Teachers
                        </Label>
                        <Input
                          id="totalTeachers"
                          type="number"
                          value={formData.totalTeachers}
                          onChange={(e) => handleInputChange("totalTeachers", e.target.value)}
                          placeholder="Number of teachers"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Infrastructure Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building className="h-6 w-6" />
                      School Infrastructure
                    </CardTitle>
                    <CardDescription>
                      Tell us about your school's facilities and infrastructure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buildingCondition" className="text-base font-medium">
                          Building Condition
                        </Label>
                        <Select value={formData.buildingCondition} onValueChange={(value) => handleInputChange("buildingCondition", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select building condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor - Needs Repair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="classroomCount" className="text-base font-medium">
                          Number of Classrooms
                        </Label>
                        <Input
                          id="classroomCount"
                          type="number"
                          value={formData.classroomCount}
                          onChange={(e) => handleInputChange("classroomCount", e.target.value)}
                          placeholder="Classroom count"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Available Facilities</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="libraryAvailable" className="text-base font-medium">
                            <BookOpen className="w-4 h-4 inline mr-1" />
                            Library
                          </Label>
                          <Select value={formData.libraryAvailable} onValueChange={(value) => handleInputChange("libraryAvailable", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Yes/No" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Available</SelectItem>
                              <SelectItem value="no">Not Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="computerLabAvailable" className="text-base font-medium">
                            Computer Lab
                          </Label>
                          <Select value={formData.computerLabAvailable} onValueChange={(value) => handleInputChange("computerLabAvailable", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Yes/No" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Available</SelectItem>
                              <SelectItem value="no">Not Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="internetAvailable" className="text-base font-medium">
                            <Wifi className="w-4 h-4 inline mr-1" />
                            Internet
                          </Label>
                          <Select value={formData.internetAvailable} onValueChange={(value) => handleInputChange("internetAvailable", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Yes/No" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Available</SelectItem>
                              <SelectItem value="no">Not Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="electricityAvailable" className="text-base font-medium">
                            <Zap className="w-4 h-4 inline mr-1" />
                            Electricity
                          </Label>
                          <Select value={formData.electricityAvailable} onValueChange={(value) => handleInputChange("electricityAvailable", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Yes/No" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Available</SelectItem>
                              <SelectItem value="no">Not Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Director Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-6 w-6" />
                      Director Information
                    </CardTitle>
                    <CardDescription>
                      Your personal information as the school director
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="directorName" className="text-base font-medium">
                          Full Name *
                        </Label>
                        <Input
                          id="directorName"
                          value={formData.directorName}
                          onChange={(e) => handleInputChange("directorName", e.target.value)}
                          placeholder="Enter your full name"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="directorGender" className="text-base font-medium">
                          Gender
                        </Label>
                        <Select value={formData.directorGender} onValueChange={(value) => handleInputChange("directorGender", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="directorAge" className="text-base font-medium">
                          Age
                        </Label>
                        <Input
                          id="directorAge"
                          type="number"
                          value={formData.directorAge}
                          onChange={(e) => handleInputChange("directorAge", e.target.value)}
                          placeholder="Your age"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="directorPhone" className="text-base font-medium">
                          Phone Number *
                        </Label>
                        <Input
                          id="directorPhone"
                          value={formData.directorPhone}
                          onChange={(e) => handleInputChange("directorPhone", e.target.value)}
                          placeholder="Your phone number"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="directorEmail" className="text-base font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="directorEmail"
                          type="email"
                          value={formData.directorEmail}
                          onChange={(e) => handleInputChange("directorEmail", e.target.value)}
                          placeholder="Your email address"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact & Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="h-6 w-6" />
                      Contact & Location
                    </CardTitle>
                    <CardDescription>
                      School contact information and precise location
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="schoolPhone" className="text-base font-medium">
                          School Phone Number
                        </Label>
                        <Input
                          id="schoolPhone"
                          value={formData.schoolPhone}
                          onChange={(e) => handleInputChange("schoolPhone", e.target.value)}
                          placeholder="School's main phone number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="schoolEmail" className="text-base font-medium">
                          School Email Address
                        </Label>
                        <Input
                          id="schoolEmail"
                          type="email"
                          value={formData.schoolEmail}
                          onChange={(e) => handleInputChange("schoolEmail", e.target.value)}
                          placeholder="School's email address"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* GPS Location */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">
                          GPS Location (Optional)
                        </Label>
                        <Button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                          variant="outline"
                          size="sm"
                        >
                          {locationLoading ? (
                            "Getting location..."
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-2" />
                              Get Current Location
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="latitude" className="text-sm">
                            Latitude
                          </Label>
                          <Input
                            id="latitude"
                            value={formData.latitude}
                            onChange={(e) => handleInputChange("latitude", e.target.value)}
                            placeholder="0.000000"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude" className="text-sm">
                            Longitude
                          </Label>
                          <Input
                            id="longitude"
                            value={formData.longitude}
                            onChange={(e) => handleInputChange("longitude", e.target.value)}
                            placeholder="0.000000"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {formData.latitude && formData.longitude && (
                        <div className="mt-3 text-sm text-green-600 bg-green-50 p-3 rounded">
                          ✅ Location captured: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-6 w-6" />
                      Additional Information
                    </CardTitle>
                    <CardDescription>
                      Help us understand your school's unique situation and needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="challenges" className="text-base font-medium">
                        Main Challenges
                      </Label>
                      <Textarea
                        id="challenges"
                        value={formData.challenges}
                        onChange={(e) => handleInputChange("challenges", e.target.value)}
                        placeholder="Describe the main challenges your school faces..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="achievements" className="text-base font-medium">
                        Key Achievements
                      </Label>
                      <Textarea
                        id="achievements"
                        value={formData.achievements}
                        onChange={(e) => handleInputChange("achievements", e.target.value)}
                        placeholder="Share your school's notable achievements and successes..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="supportNeeded" className="text-base font-medium">
                        Support Needed
                      </Label>
                      <Textarea
                        id="supportNeeded"
                        value={formData.supportNeeded}
                        onChange={(e) => handleInputChange("supportNeeded", e.target.value)}
                        placeholder="What kind of support would benefit your school most?"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes" className="text-base font-medium">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        placeholder="Any other information you'd like to share..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-medium mb-2">
                          Ready to submit your registration?
                        </p>
                        <p className="text-sm text-blue-700">
                          Please review all information carefully before submitting. 
                          Once submitted, your registration will be reviewed by our team.
                        </p>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-12 py-4 text-lg font-semibold"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Submitting Registration...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Submit School Registration
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}