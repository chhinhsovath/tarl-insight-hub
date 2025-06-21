"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGlobalLanguage } from "@/lib/global-language-context";

interface Province {
  id: number;
  name: string;
  name_kh?: string;
  code: string;
}

interface District {
  id: number;
  name: string;
  name_kh?: string;
  code: string;
  province_id: number;
}

interface Commune {
  id: number;
  commune_name: string;
  district_id: number;
}

interface Village {
  id: number;
  village_name: string;
  commune_id: number;
}

interface DemographicDropdownsProps {
  selectedProvince?: string;
  selectedDistrict?: string;
  selectedCommune?: string;
  selectedVillage?: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onCommuneChange: (value: string) => void;
  onVillageChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function DemographicDropdowns({
  selectedProvince,
  selectedDistrict,
  selectedCommune,
  selectedVillage,
  onProvinceChange,
  onDistrictChange,
  onCommuneChange,
  onVillageChange,
  required = false,
  disabled = false
}: DemographicDropdownsProps) {
  const { language } = useGlobalLanguage();
  const isKhmer = language === 'kh';

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince);
      // Reset lower levels
      onDistrictChange('');
      onCommuneChange('');
      onVillageChange('');
      setCommunes([]);
      setVillages([]);
    } else {
      setDistricts([]);
      setCommunes([]);
      setVillages([]);
    }
  }, [selectedProvince]);

  // Load communes when district changes
  useEffect(() => {
    if (selectedDistrict) {
      loadCommunes(selectedDistrict);
      // Reset lower levels
      onCommuneChange('');
      onVillageChange('');
      setVillages([]);
    } else {
      setCommunes([]);
      setVillages([]);
    }
  }, [selectedDistrict]);

  // Load villages when commune changes
  useEffect(() => {
    if (selectedCommune) {
      loadVillages(selectedCommune);
      // Reset lower level
      onVillageChange('');
    } else {
      setVillages([]);
    }
  }, [selectedCommune]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await fetch('/api/data/provinces');
      if (response.ok) {
        const data = await response.json();
        setProvinces(data);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/data/districts?provinceId=${provinceId}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadCommunes = async (districtId: string) => {
    setLoadingCommunes(true);
    try {
      const response = await fetch(`/api/data/communes?district_id=${districtId}`);
      if (response.ok) {
        const data = await response.json();
        setCommunes(data);
      }
    } catch (error) {
      console.error('Error loading communes:', error);
    } finally {
      setLoadingCommunes(false);
    }
  };

  const loadVillages = async (communeId: string) => {
    setLoadingVillages(true);
    try {
      const response = await fetch(`/api/data/villages?commune_id=${communeId}`);
      if (response.ok) {
        const data = await response.json();
        setVillages(data);
      }
    } catch (error) {
      console.error('Error loading villages:', error);
    } finally {
      setLoadingVillages(false);
    }
  };

  const getDisplayName = (item: any, nameField: string = 'name', khNameField: string = 'name_kh') => {
    if (isKhmer && item[khNameField]) {
      return item[khNameField];
    }
    return item[nameField];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Province */}
      <div>
        <Label htmlFor="province">
          {isKhmer ? "ខេត្ត/រាជធានី" : "Province"} {required && "*"}
        </Label>
        <Select 
          value={selectedProvince} 
          onValueChange={onProvinceChange}
          disabled={disabled || loadingProvinces}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loadingProvinces 
                ? (isKhmer ? "កំពុងទាញយក..." : "Loading...")
                : (isKhmer ? "ជ្រើសរើសខេត្ត/រាជធានី" : "Select province")
            } />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id.toString()}>
                {getDisplayName(province)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* District */}
      <div>
        <Label htmlFor="district">
          {isKhmer ? "ស្រុក/ខណ្ឌ" : "District"} {required && "*"}
        </Label>
        <Select 
          value={selectedDistrict} 
          onValueChange={onDistrictChange}
          disabled={disabled || !selectedProvince || loadingDistricts}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loadingDistricts 
                ? (isKhmer ? "កំពុងទាញយក..." : "Loading...")
                : !selectedProvince
                ? (isKhmer ? "ជ្រើសរើសខេត្តជាមុន" : "Select province first")
                : (isKhmer ? "ជ្រើសរើសស្រុក/ខណ្ឌ" : "Select district")
            } />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id.toString()}>
                {getDisplayName(district)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Commune */}
      <div>
        <Label htmlFor="commune">
          {isKhmer ? "ឃុំ/សង្កាត់" : "Commune"} {required && "*"}
        </Label>
        <Select 
          value={selectedCommune} 
          onValueChange={onCommuneChange}
          disabled={disabled || !selectedDistrict || loadingCommunes}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loadingCommunes 
                ? (isKhmer ? "កំពុងទាញយក..." : "Loading...")
                : !selectedDistrict
                ? (isKhmer ? "ជ្រើសរើសស្រុកជាមុន" : "Select district first")
                : (isKhmer ? "ជ្រើសរើសឃុំ/សង្កាត់" : "Select commune")
            } />
          </SelectTrigger>
          <SelectContent>
            {communes.map((commune) => (
              <SelectItem key={commune.id} value={commune.id.toString()}>
                {commune.commune_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Village */}
      <div>
        <Label htmlFor="village">
          {isKhmer ? "ភូមិ" : "Village"} {required && "*"}
        </Label>
        <Select 
          value={selectedVillage} 
          onValueChange={onVillageChange}
          disabled={disabled || !selectedCommune || loadingVillages}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loadingVillages 
                ? (isKhmer ? "កំពុងទាញយក..." : "Loading...")
                : !selectedCommune
                ? (isKhmer ? "ជ្រើសរើសឃុំជាមុន" : "Select commune first")
                : (isKhmer ? "ជ្រើសរើសភូមិ" : "Select village")
            } />
          </SelectTrigger>
          <SelectContent>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id.toString()}>
                {village.village_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}