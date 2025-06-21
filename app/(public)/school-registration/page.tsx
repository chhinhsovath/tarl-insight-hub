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
import { KhmerDemographicDropdowns } from "@/components/khmer-demographic-dropdowns";
import { useSchoolRegistrationTranslation } from "@/lib/school-registration-i18n";

interface School {
  sclAutoID: number;
  sclCode?: string;
  sclName: string;
  sclZoneName?: string;
  sclProvinceName: string;
  sclDistrictName: string;
  sclCommuneName?: string;
  sclVillageName?: string;
  sclCluster?: string;
  sclZone?: string;
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
  
  // School Details
  schoolCode: string;
  schoolCluster: string;
  schoolZone: string;
  
  // Demographic Areas
  provinceId: string;
  districtId: string;
  communeId: string;
  villageId: string;
  provinceName: string;
  districtName: string;
  communeName: string;
  villageName: string;
  detailedAddress: string;
  postalCode: string;
  
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
  // Use only Khmer translations
  const { t } = useSchoolRegistrationTranslation();
  const isKhmer = true; // Always Khmer
  
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
    schoolCode: "",
    schoolCluster: "",
    schoolZone: "",
    provinceId: "",
    districtId: "",
    communeId: "",
    villageId: "",
    provinceName: "",
    districtName: "",
    communeName: "",
    villageName: "",
    detailedAddress: "",
    postalCode: "",
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

  // Search schools when search term changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        loadSchools(searchTerm);
      } else {
        setSchools([]);
        setFilteredSchools([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Update filtered schools when schools data changes
  useEffect(() => {
    setFilteredSchools(schools.slice(0, 10)); // Show up to 10 results
  }, [schools]);

  const loadSchools = async (searchQuery: string = "") => {
    if (!searchQuery.trim()) {
      setSchools([]);
      return;
    }
    
    try {
      setLoadingSchools(true);
      console.log("Searching for schools with query:", searchQuery);
      
      const response = await fetch(`/api/public/schools?search=${encodeURIComponent(searchQuery)}&limit=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Received schools data:", data);
        setSchools(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.text();
        console.error("API error:", response.status, errorData);
        toast.error(t.failedToSearchSchools);
      }
    } catch (error) {
      console.error("Error searching schools:", error);
      toast.error(t.failedToSearchSchools);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSearchTerm(school.sclName);
    setFilteredSchools([]);
    
    // Pre-populate form data with existing school information
    setFormData(prev => ({
      ...prev,
      schoolCode: school.sclCode || "",
      schoolCluster: school.sclCluster || "",
      schoolZone: school.sclZone || ""
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
      toast.error(`${t.yourDevice} ${t.doesntSupportGPS}`);
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
        toast.success(t.locationCapturedSuccess);
      },
      (error) => {
        setLocationLoading(false);
        toast.error(t.couldNotGetLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [t]);

  const validateForm = () => {
    if (!selectedSchool) {
      toast.error(t.pleaseSelectSchool);
      return false;
    }

    const required = [
      { field: formData.directorName, name: t.fullName },
      { field: formData.directorPhone, name: t.phoneNumber },
      { field: formData.schoolType, name: t.schoolType },
      { field: formData.schoolLevel, name: t.schoolLevel }
    ];

    for (const item of required) {
      if (!item.field?.trim()) {
        toast.error(`${t.pleaseEnter} ${item.name}`);
        return false;
      }
    }

    if (formData.directorEmail && !/\S+@\S+\.\S+/.test(formData.directorEmail)) {
      toast.error(t.invalidEmailFormat);
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
        toast.success(t.registrationSubmitted);
      } else {
        toast.error(result.error || t.registrationFailed);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(t.networkError);
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
            <CardTitle className={`text-green-600 text-2xl ${isKhmer ? 'font-hanuman' : ''}`}>
              {t.registrationSuccessful}
            </CardTitle>
            <CardDescription className={`text-lg ${isKhmer ? 'font-hanuman' : ''}`}>
              {t.registrationSubmitted}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className={`text-green-800 font-medium mb-2 ${isKhmer ? 'font-hanuman' : ''}`}>
                {t.whatHappensNext}
              </p>
              <ul className={`text-sm text-green-700 space-y-1 text-left ${isKhmer ? 'font-hanuman' : ''}`}>
                <li>{t.registrationPending}</li>
                <li>{t.adminReview}</li>
                <li>{t.receiveConfirmation}</li>
                <li>{t.accessCredentials}</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = "/"} 
                variant="outline"
                className={`flex items-center gap-2 ${isKhmer ? 'font-hanuman' : ''}`}
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToHome}
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                className={`flex items-center gap-2 ${isKhmer ? 'font-hanuman' : ''}`}
              >
                <School className="w-4 h-4" />
                {t.registerAnother}
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
            <h1 className={`text-4xl font-bold text-gray-900 mb-3 ${isKhmer ? 'font-hanuman' : ''}`}>
              {t.schoolRegistration}
            </h1>
            <p className={`text-xl text-gray-600 max-w-2xl mx-auto ${isKhmer ? 'font-hanuman' : ''}`}>
              {t.pageSubtitle}
            </p>
            <div className={`mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm ${isKhmer ? 'font-hanuman' : ''}`}>
              <Users className="w-4 h-4" />
              {t.forDirectorsNote}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* School Search & Selection */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>
                  <Search className="h-6 w-6" />
                  {t.findYourSchool}
                </CardTitle>
                <CardDescription className={isKhmer ? 'font-hanuman' : ''}>
                  {t.searchDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-10 text-lg py-3 ${isKhmer ? 'font-hanuman' : ''}`}
                  />
                  {loadingSchools && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                
                {searchTerm.length > 0 && searchTerm.length < 2 && (
                  <p className={`text-sm text-gray-500 mt-1 ${isKhmer ? 'font-hanuman' : ''}`}>
                    {t.searchMinChars}
                  </p>
                )}

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
                            <h4 className={`font-semibold text-gray-900 text-lg ${isKhmer ? 'font-hanuman' : ''}`}>{school.sclName}</h4>
                            {school.sclCode && (
                              <p className={`text-gray-600 mt-1 ${isKhmer ? 'font-hanuman' : ''}`}>
                                <span className="font-medium">{t.schoolCode}:</span> {school.sclCode}
                              </p>
                            )}
                            <p className={`text-sm text-gray-500 mt-1 ${isKhmer ? 'font-hanuman' : ''}`}>
                              📍 {[school.sclCluster, school.sclCommuneName, school.sclDistrictName, school.sclProvinceName].filter(Boolean).join(', ')}
                              {school.sclZoneName && <span className="block text-xs">{t.zone}: {school.sclZoneName}</span>}
                            </p>
                          </div>
                          <Badge variant={school.sclStatus === 1 ? "default" : "secondary"} className={isKhmer ? 'font-hanuman' : ''}>
                            {school.sclStatus === 1 ? t.active : t.inactive}
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
                        <h4 className={`font-bold text-blue-900 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>{selectedSchool.sclName}</h4>
                        {selectedSchool.sclCode && (
                          <p className={`text-blue-700 mt-1 ${isKhmer ? 'font-hanuman' : ''}`}>
                            <span className="font-medium">{t.schoolCode}:</span> {selectedSchool.sclCode}
                          </p>
                        )}
                        <p className={`text-blue-600 text-sm mt-1 ${isKhmer ? 'font-hanuman' : ''}`}>
                          📍 {[selectedSchool.sclCluster, selectedSchool.sclCommuneName, selectedSchool.sclDistrictName, selectedSchool.sclProvinceName].filter(Boolean).join(', ')}
                          {selectedSchool.sclZoneName && <span className="block text-xs mt-1">{t.zone}: {selectedSchool.sclZoneName}</span>}
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
                        className={isKhmer ? 'font-hanuman' : ''}
                      >
                        {t.changeSchool}
                      </Button>
                    </div>
                  </div>
                )}

                {searchTerm && filteredSchools.length === 0 && !loadingSchools && (
                  <div className={`text-center py-8 text-gray-500 ${isKhmer ? 'font-hanuman' : ''}`}>
                    <School className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>{t.noSchoolsFound} "{searchTerm}"</p>
                    <p className="text-sm mt-1">{t.tryDifferentKeywords}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedSchool && (
              <>
                {/* Basic School Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>
                      <School className="h-6 w-6" />
                      {t.basicSchoolInfo}
                    </CardTitle>
                    <CardDescription className={isKhmer ? 'font-hanuman' : ''}>
                      {t.basicInfoDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="schoolType" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.schoolType} {t.required}
                        </Label>
                        <Select value={formData.schoolType} onValueChange={(value) => handleInputChange("schoolType", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t.schoolType} className={isKhmer ? 'font-hanuman' : ''} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public" className={isKhmer ? 'font-hanuman' : ''}>{t.publicSchool}</SelectItem>
                            <SelectItem value="private" className={isKhmer ? 'font-hanuman' : ''}>{t.privateSchool}</SelectItem>
                            <SelectItem value="community" className={isKhmer ? 'font-hanuman' : ''}>{t.communitySchool}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="schoolLevel" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.schoolLevel} {t.required}
                        </Label>
                        <Select value={formData.schoolLevel} onValueChange={(value) => handleInputChange("schoolLevel", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t.schoolLevel} className={isKhmer ? 'font-hanuman' : ''} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary" className={isKhmer ? 'font-hanuman' : ''}>{t.primarySchool}</SelectItem>
                            <SelectItem value="secondary" className={isKhmer ? 'font-hanuman' : ''}>{t.secondarySchool}</SelectItem>
                            <SelectItem value="high" className={isKhmer ? 'font-hanuman' : ''}>{t.highSchool}</SelectItem>
                            <SelectItem value="mixed" className={isKhmer ? 'font-hanuman' : ''}>{t.mixedLevels}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="establishedYear" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.establishedYear}
                        </Label>
                        <Input
                          id="establishedYear"
                          type="number"
                          value={formData.establishedYear}
                          onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                          placeholder={t.establishedYear}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="totalClasses" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.totalClasses}
                        </Label>
                        <Input
                          id="totalClasses"
                          type="number"
                          value={formData.totalClasses}
                          onChange={(e) => handleInputChange("totalClasses", e.target.value)}
                          placeholder={t.totalClasses}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="totalStudents" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.totalStudents}
                        </Label>
                        <Input
                          id="totalStudents"
                          type="number"
                          value={formData.totalStudents}
                          onChange={(e) => handleInputChange("totalStudents", e.target.value)}
                          placeholder={t.totalStudents}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="totalTeachers" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.totalTeachers}
                        </Label>
                        <Input
                          id="totalTeachers"
                          type="number"
                          value={formData.totalTeachers}
                          onChange={(e) => handleInputChange("totalTeachers", e.target.value)}
                          placeholder={t.totalTeachers}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* School Details Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>
                      <School className="h-6 w-6" />
                      {t.newSchoolCode}
                    </CardTitle>
                    <CardDescription className={isKhmer ? 'font-hanuman' : ''}>
                      Update or add school administrative details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="schoolCode" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.newSchoolCode} {t.optional}
                        </Label>
                        <Input
                          id="schoolCode"
                          value={formData.schoolCode}
                          onChange={(e) => handleInputChange("schoolCode", e.target.value)}
                          placeholder={t.newSchoolCode}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="schoolCluster" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.newSchoolCluster} {t.optional}
                        </Label>
                        <Input
                          id="schoolCluster"
                          value={formData.schoolCluster}
                          onChange={(e) => handleInputChange("schoolCluster", e.target.value)}
                          placeholder={t.newSchoolCluster}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="schoolZone" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.newSchoolZone} {t.optional}
                        </Label>
                        <Input
                          id="schoolZone"
                          value={formData.schoolZone}
                          onChange={(e) => handleInputChange("schoolZone", e.target.value)}
                          placeholder={t.newSchoolZone}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Demographic Areas Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>
                      <MapPin className="h-6 w-6" />
                      {t.province} → {t.district} → {t.commune} → {t.village}
                    </CardTitle>
                    <CardDescription className={isKhmer ? 'font-hanuman' : ''}>
                      Select the administrative location hierarchy for your school
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <KhmerDemographicDropdowns
                      selectedProvince={formData.provinceId}
                      selectedDistrict={formData.districtId}
                      selectedCommune={formData.communeId}
                      selectedVillage={formData.villageId}
                      onProvinceChange={(provinceId) => {
                        handleInputChange('provinceId', provinceId);
                      }}
                      onDistrictChange={(districtId) => {
                        handleInputChange('districtId', districtId);
                      }}
                      onCommuneChange={(communeId) => {
                        handleInputChange('communeId', communeId);
                      }}
                      onVillageChange={(villageId) => {
                        handleInputChange('villageId', villageId);
                      }}
                      required={false}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="detailedAddress" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.detailedAddress} {t.optional}
                        </Label>
                        <Textarea
                          id="detailedAddress"
                          value={formData.detailedAddress}
                          onChange={(e) => handleInputChange("detailedAddress", e.target.value)}
                          placeholder={t.detailedAddress}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className={`text-base font-medium ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.postalCode} {t.optional}
                        </Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange("postalCode", e.target.value)}
                          placeholder={t.postalCode}
                          className={`mt-1 ${isKhmer ? 'font-hanuman' : ''}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Infrastructure Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>
                      <Building className="h-6 w-6" />
                      {t.schoolInfrastructure}
                    </CardTitle>
                    <CardDescription className={isKhmer ? 'font-hanuman' : ''}>
                      {t.infrastructureDescription}
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
                    <CardTitle className={`flex items-center gap-2 text-xl ${isKhmer ? 'font-hanuman' : ''}`}>
                      <User className="h-6 w-6" />
                      {t.directorInfo}
                    </CardTitle>
                    <CardDescription className={isKhmer ? 'font-hanuman' : ''}>
                      {t.directorInfoDescription}
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
                        <p className={`text-blue-800 font-medium mb-2 ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.readyToSubmit}
                        </p>
                        <p className={`text-sm text-blue-700 ${isKhmer ? 'font-hanuman' : ''}`}>
                          {t.reviewCarefully}
                        </p>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={loading}
                        className={`w-full md:w-auto px-12 py-4 text-lg font-semibold ${isKhmer ? 'font-hanuman' : ''}`}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {t.submittingRegistration}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {t.submitRegistration}
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