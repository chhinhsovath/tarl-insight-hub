"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
  province_id: number;
}

interface Commune {
  id: number;
  commune_name: string;
  district_id: number;
}

interface Village {
  id: number;
  village_code: number;
  village_name: string;
  commune_id: number;
}

interface KhmerDemographicDropdownsProps {
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

export function KhmerDemographicDropdowns({
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
}: KhmerDemographicDropdownsProps) {
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
      const response = await fetch('/api/demographics/provinces');
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

  const loadDistricts = async (provinceCode: string) => {
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/demographics/districts?provinceCode=${provinceCode}`);
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

  const loadCommunes = async (districtCode: string) => {
    setLoadingCommunes(true);
    try {
      const response = await fetch(`/api/demographics/communes?districtCode=${districtCode}`);
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

  const loadVillages = async (communeCode: string) => {
    setLoadingVillages(true);
    try {
      const response = await fetch(`/api/demographics/villages?communeCode=${communeCode}`);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Province */}
      <div>
        <Label htmlFor="province" className="font-hanuman">
          ខេត្ត/រាជធានី {required && "*"}
        </Label>
        <Select 
          value={selectedProvince} 
          onValueChange={onProvinceChange}
          disabled={disabled || loadingProvinces}
        >
          <SelectTrigger className="font-hanuman">
            <SelectValue placeholder={
              loadingProvinces 
                ? "កំពុងទាញយក..."
                : "ជ្រើសរើសខេត្ត/រាជធានី"
            } />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id.toString()} className="font-hanuman">
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* District */}
      <div>
        <Label htmlFor="district" className="font-hanuman">
          ស្រុក/ខណ្ឌ {required && "*"}
        </Label>
        <Select 
          value={selectedDistrict} 
          onValueChange={onDistrictChange}
          disabled={disabled || !selectedProvince || loadingDistricts}
        >
          <SelectTrigger className="font-hanuman">
            <SelectValue placeholder={
              loadingDistricts 
                ? "កំពុងទាញយក..."
                : !selectedProvince
                ? "ជ្រើសរើសខេត្តជាមុន"
                : "ជ្រើសរើសស្រុក/ខណ្ឌ"
            } />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id.toString()} className="font-hanuman">
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Commune */}
      <div>
        <Label htmlFor="commune" className="font-hanuman">
          ឃុំ/សង្កាត់ {required && "*"}
        </Label>
        <Select 
          value={selectedCommune} 
          onValueChange={onCommuneChange}
          disabled={disabled || !selectedDistrict || loadingCommunes}
        >
          <SelectTrigger className="font-hanuman">
            <SelectValue placeholder={
              loadingCommunes 
                ? "កំពុងទាញយក..."
                : !selectedDistrict
                ? "ជ្រើសរើសស្រុកជាមុន"
                : "ជ្រើសរើសឃុំ/សង្កាត់"
            } />
          </SelectTrigger>
          <SelectContent>
            {communes.map((commune) => (
              <SelectItem key={commune.id} value={commune.id.toString()} className="font-hanuman">
                {commune.commune_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Village */}
      <div>
        <Label htmlFor="village" className="font-hanuman">
          ភូមិ {required && "*"}
        </Label>
        <Select 
          value={selectedVillage} 
          onValueChange={onVillageChange}
          disabled={disabled || !selectedCommune || loadingVillages}
        >
          <SelectTrigger className="font-hanuman">
            <SelectValue placeholder={
              loadingVillages 
                ? "កំពុងទាញយក..."
                : !selectedCommune
                ? "ជ្រើសរើសឃុំជាមុន"
                : "ជ្រើសរើសភូមិ"
            } />
          </SelectTrigger>
          <SelectContent>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id.toString()} className="font-hanuman">
                {village.village_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}