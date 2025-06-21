"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, School, User, Mail, Phone, FileText, CheckCircle } from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";
import { DemographicDropdowns } from "@/components/demographic-dropdowns";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function SchoolRegistrationPage() {
  const { language } = useGlobalLanguage();
  const isKhmer = language === 'kh';
  
  const [formData, setFormData] = useState({
    schoolName: "",
    schoolCode: "",
    directorName: "",
    directorSex: "",
    directorAge: "",
    directorPhone: "",
    directorEmail: "",
    village: "",
    commune: "",
    district: "",
    province: "",
    note: "",
    gpsLatitude: null as number | null,
    gpsLongitude: null as number | null
  });

  // Demographic selection states
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const handleInputChange = (field: string, value: string) => {
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
        const { latitude, longitude, accuracy } = position.coords;
        setLocationData({ latitude, longitude, accuracy });
        setFormData(prev => ({
          ...prev,
          gpsLatitude: latitude,
          gpsLongitude: longitude
        }));
        setLocationLoading(false);
        toast.success(isKhmer ? "ទីតាំង GPS ត្រូវបានរកឃើញ" : "GPS location captured successfully");
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = isKhmer ? "មិនអាចរកទីតាំង GPS បានទេ" : "Could not get GPS location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = isKhmer ? "សូមអនុញ្ញាតការចូលប្រើទីតាំង" : "Please allow location access";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = isKhmer ? "ទីតាំងមិនអាចប្រើបានទេ" : "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = isKhmer ? "ការស្វែងរកទីតាំងអស់ពេល" : "Location request timed out";
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [isKhmer]);

  const validateForm = () => {
    const required = [
      { field: formData.schoolName, name: isKhmer ? "ឈ្មោះសាលា" : "School Name" },
      { field: formData.schoolCode, name: isKhmer ? "លេខកូដសាលា" : "School Code" },
      { field: formData.directorName, name: isKhmer ? "ឈ្មោះនាយកសាលា" : "Director Name" },
      { field: formData.directorSex, name: isKhmer ? "ភេទនាយកសាលា" : "Director Gender" },
      { field: formData.directorPhone, name: isKhmer ? "លេខទូរស័ព្ទ" : "Phone Number" },
      { field: selectedVillage, name: isKhmer ? "ភូមិ" : "Village" },
      { field: selectedCommune, name: isKhmer ? "ឃុំ/សង្កាត់" : "Commune" },
      { field: selectedDistrict, name: isKhmer ? "ស្រុក/ខណ្ឌ" : "District" },
      { field: selectedProvince, name: isKhmer ? "ខេត្ត/រាជធានី" : "Province" }
    ];

    for (const item of required) {
      if (!item.field?.trim()) {
        toast.error(`${isKhmer ? "សូមបញ្ចូល" : "Please enter"} ${item.name}`);
        return false;
      }
    }

    if (formData.directorEmail && !/\S+@\S+\.\S+/.test(formData.directorEmail)) {
      toast.error(isKhmer ? "អ៊ីមែលមិនត្រឹមត្រូវ" : "Invalid email format");
      return false;
    }

    if (!formData.gpsLatitude || !formData.gpsLongitude) {
      toast.error(isKhmer ? "សូមចាប់យកទីតាំង GPS" : "Please capture GPS location");
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
          ...formData,
          provinceId: selectedProvince,
          districtId: selectedDistrict,
          communeId: selectedCommune,
          villageId: selectedVillage
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
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
            <Button onClick={() => window.location.href = "/"} className="w-full">
              {isKhmer ? "ត្រឡប់ទៅទំព័រដើម" : "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <School className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isKhmer ? "ការចុះឈ្មោះសាលារៀន" : "School Registration"}
            </h1>
            <p className="text-gray-600">
              {isKhmer 
                ? "សូមបំពេញព័ត៌មានលម្អិតខាងក្រោមដើម្បីចុះឈ្មោះសាលារបស់អ្នក"
                : "Please fill in the details below to register your school"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានសាលា" : "School Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolName">
                      {isKhmer ? "ឈ្មោះសាលា" : "School Name"} *
                    </Label>
                    <Input
                      id="schoolName"
                      value={formData.schoolName}
                      onChange={(e) => handleInputChange("schoolName", e.target.value)}
                      placeholder={isKhmer ? "បញ្ចូលឈ្មោះសាលា" : "Enter school name"}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolCode">
                      {isKhmer ? "លេខកូដសាលា" : "School Code"} *
                    </Label>
                    <Input
                      id="schoolCode"
                      value={formData.schoolCode}
                      onChange={(e) => handleInputChange("schoolCode", e.target.value)}
                      placeholder={isKhmer ? "បញ្ចូលលេខកូដសាលា" : "Enter school code"}
                      required
                    />
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
                    <Label htmlFor="directorSex">
                      {isKhmer ? "ភេទ" : "Gender"} *
                    </Label>
                    <Select value={formData.directorSex} onValueChange={(value) => handleInputChange("directorSex", value)}>
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
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {isKhmer ? "ព័ត៌មានទីតាំង" : "Location Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DemographicDropdowns
                  selectedProvince={selectedProvince}
                  selectedDistrict={selectedDistrict}
                  selectedCommune={selectedCommune}
                  selectedVillage={selectedVillage}
                  onProvinceChange={setSelectedProvince}
                  onDistrictChange={setSelectedDistrict}
                  onCommuneChange={setSelectedCommune}
                  onVillageChange={setSelectedVillage}
                  required
                />

                {/* GPS Location */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">
                      {isKhmer ? "ទីតាំង GPS" : "GPS Location"} *
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
                  
                  {locationData ? (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                      <div className="font-medium mb-1">
                        {isKhmer ? "ទីតាំងត្រូវបានរកឃើញ:" : "Location captured:"}
                      </div>
                      <div>
                        {isKhmer ? "រយៈទទឹង:" : "Latitude:"} {locationData.latitude.toFixed(6)}
                      </div>
                      <div>
                        {isKhmer ? "រយៈបណ្តោយ:" : "Longitude:"} {locationData.longitude.toFixed(6)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {isKhmer ? "ភាពត្រឹមត្រូវ:" : "Accuracy:"} ±{locationData.accuracy.toFixed(0)}m
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {isKhmer 
                        ? "សូមចុចប៊ូតុង \"ចាប់យកទីតាំង\" ដើម្បីបន្ថែមទីតាំង GPS"
                        : "Click \"Get Location\" button to capture GPS coordinates"
                      }
                    </div>
                  )}
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
              <CardContent>
                <div>
                  <Label htmlFor="note">
                    {isKhmer ? "កំណត់ចំណាំ" : "Notes"}
                  </Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                    placeholder={isKhmer ? "បញ្ចូលកំណត់ចំណាំបន្ថែម..." : "Enter additional notes..."}
                    rows={4}
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
          </form>
        </div>
      </div>
    </div>
  );
}