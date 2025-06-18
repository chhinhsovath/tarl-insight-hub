"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  X, 
  Upload, 
  Link, 
  FileText, 
  Trash2, 
  Edit, 
  Download,
  ExternalLink,
  File,
  Video,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTrainingTranslation } from '@/lib/training-i18n';

interface TrainingMaterial {
  id?: number;
  material_name: string;
  material_type: 'file' | 'link';
  file_path?: string;
  file_size?: number;
  file_type?: string;
  original_filename?: string;
  external_url?: string;
  description?: string;
  is_required: boolean;
  sort_order?: number;
}

interface TrainingProgramFormProps {
  editingProgram?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TrainingProgramForm({ editingProgram, onSuccess, onCancel }: TrainingProgramFormProps) {
  const { t } = useTrainingTranslation();
  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_name: '',
    description: '',
    program_type: 'standard',
    duration_hours: '8'
  });
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [newLinkMaterial, setNewLinkMaterial] = useState({
    material_name: '',
    external_url: '',
    description: '',
    is_required: false
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    // If editing, populate form with existing data
    if (editingProgram) {
      setFormData({
        program_name: editingProgram.program_name || '',
        description: editingProgram.description || '',
        program_type: editingProgram.program_type || 'standard',
        duration_hours: editingProgram.duration_hours?.toString() || '8'
      });
      
      // Load existing materials
      if (editingProgram.id) {
        fetchMaterials(editingProgram.id);
      }
    }
  }, [editingProgram]);

  const fetchMaterials = async (programId: number) => {
    try {
      const response = await fetch(`/api/training/materials?program_id=${programId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const programTypes = [
    { value: 'standard', label: t.standardTraining },
    { value: 'intensive', label: t.intensiveTraining },
    { value: 'refresher', label: t.refresherCourse },
    { value: 'workshop', label: t.workshop },
    { value: 'seminar', label: t.seminar },
    { value: 'certification', label: t.certificationProgram },
    { value: 'orientation', label: t.orientation },
    { value: 'specialized', label: t.specializedTraining }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!editingProgram?.id) {
      toast.error(t.saveProgramFirst);
      return;
    }

    const materialName = prompt(t.materialName + ':');
    if (!materialName) return;

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('program_id', editingProgram.id.toString());
      formData.append('material_name', materialName);
      formData.append('description', '');
      formData.append('is_required', 'false');

      console.log('Uploading file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        programId: editingProgram.id,
        materialName
      });

      const response = await fetch('/api/training/materials/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('Upload response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload success:', result);
        setMaterials(prev => [...prev, result.material]);
        toast.success(t.fileUploadedSuccess);
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown upload error' }));
        console.error('Upload error:', error);
        toast.error(error.error || t.failedToUploadFile);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t.failedToUploadFile);
    } finally {
      setUploadingFile(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleAddLink = async () => {
    if (!editingProgram?.id) {
      toast.error(t.saveProgramFirst);
      return;
    }

    if (!newLinkMaterial.material_name || !newLinkMaterial.external_url) {
      toast.error(t.materialNameRequired);
      return;
    }

    setMaterialsLoading(true);

    try {
      const response = await fetch('/api/training/materials', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: editingProgram.id,
          ...newLinkMaterial
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMaterials(prev => [...prev, result.material]);
        setNewLinkMaterial({
          material_name: '',
          external_url: '',
          description: '',
          is_required: false
        });
        toast.success(t.linkAddedSuccess);
      } else {
        const error = await response.json();
        toast.error(error.error || t.failedToAddLink);
      }
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error(t.failedToAddLink);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm(t.deleteMaterialConfirm)) {
      return;
    }

    try {
      const response = await fetch(`/api/training/materials?id=${materialId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
        toast.success(t.materialDeletedSuccess);
      } else {
        const error = await response.json();
        toast.error(error.error || t.failedToDeleteMaterial);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error(t.failedToDeleteMaterial);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText className="h-4 w-4 text-blue-600" />;
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return <File className="h-4 w-4 text-green-600" />;
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return <File className="h-4 w-4 text-orange-600" />;
    if (fileType?.includes('video')) return <Video className="h-4 w-4 text-purple-600" />;
    return <File className="h-4 w-4 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.program_name.trim()) {
      toast.error(t.programNameRequired);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        program_name: formData.program_name.trim(),
        description: formData.description.trim() || null,
        program_type: formData.program_type,
        duration_hours: parseInt(formData.duration_hours) || 8
      };

      const isEditing = !!editingProgram;
      const url = isEditing ? `/api/training/programs?id=${editingProgram.id}` : '/api/training/programs';
      const method = isEditing ? 'PUT' : 'POST';

      console.log('Submitting program:', { url, method, payload });
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        toast.success(isEditing ? t.trainingProgramUpdatedSuccess : t.trainingProgramCreatedSuccess);
        onSuccess();
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', error);
        toast.error(error.error || (isEditing ? t.updateSessionError : t.failedToUploadFile));
      }
    } catch (error) {
      console.error('Error creating training program:', error);
      toast.error(isEditing ? t.updateSessionError : t.failedToUploadFile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {editingProgram ? t.editTrainingProgram : t.createNewTrainingProgram}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t.basicInfo}</TabsTrigger>
              <TabsTrigger value="materials">{t.trainingMaterials} ({materials.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Program Name */}
                <div className="space-y-2">
                  <Label htmlFor="program_name">{t.programName} *</Label>
                  <Input
                    id="program_name"
                    value={formData.program_name}
                    onChange={(e) => handleInputChange('program_name', e.target.value)}
                    placeholder={t.enterTrainingProgramName}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t.enterProgramDescription}
                    rows={3}
                  />
                </div>

                {/* Program Type */}
                <div className="space-y-2">
                  <Label htmlFor="program_type">{t.programType}</Label>
                  <Select value={formData.program_type} onValueChange={(value) => handleInputChange('program_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectProgramType} />
                    </SelectTrigger>
                    <SelectContent>
                      {programTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration Hours */}
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">{t.durationHours}</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.duration_hours}
                    onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                    placeholder="8"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t.totalEstimatedDuration}
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (editingProgram ? t.updating : t.creating) : (editingProgram ? t.updateProgram : t.createProgram)}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="materials" className="space-y-6">
              {!editingProgram?.id && (
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-muted-foreground">
                    {t.saveProgramFirst}
                  </p>
                </div>
              )}
              
              {editingProgram?.id && (
                <>
                  {/* Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t.addTrainingMaterials}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* File Upload */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {t.uploadFiles}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {t.uploadWordExcelFiles}
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.avi,.mov,.webm"
                                onChange={handleFileUpload}
                                disabled={uploadingFile}
                                className="file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                              />
                            </div>
                            {uploadingFile && (
                              <p className="text-sm text-blue-600">{t.uploading}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Add Link */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            {t.addLink}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <Input
                              placeholder={t.materialName}
                              value={newLinkMaterial.material_name}
                              onChange={(e) => setNewLinkMaterial(prev => ({ ...prev, material_name: e.target.value }))}
                            />
                            <Input
                              placeholder="https://example.com"
                              value={newLinkMaterial.external_url}
                              onChange={(e) => setNewLinkMaterial(prev => ({ ...prev, external_url: e.target.value }))}
                            />
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={handleAddLink}
                              disabled={materialsLoading || !newLinkMaterial.material_name || !newLinkMaterial.external_url}
                            >
                              {materialsLoading ? t.addingMaterial : t.addLink}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <hr className="my-6" />
                  
                  {/* Materials List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t.trainingMaterials} ({materials.length})</h3>
                    
                    {materials.length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-muted-foreground">{t.noMaterialsAdded}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {materials.map((material) => (
                          <Card key={material.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="flex-shrink-0">
                                  {material.material_type === 'file' ? 
                                    getFileIcon(material.file_type || '') : 
                                    <ExternalLink className="h-4 w-4 text-blue-600" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{material.material_name}</h4>
                                  {material.material_type === 'file' ? (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      <p>{material.original_filename}</p>
                                      {material.file_size && (
                                        <p>{formatFileSize(material.file_size)}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {material.external_url}
                                    </p>
                                  )}
                                  {material.description && (
                                    <p className="text-xs text-gray-600 mt-1">{material.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {material.is_required && (
                                  <Badge variant="secondary" className="text-xs">{t.required}</Badge>
                                )}
                                {material.material_type === 'link' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(material.external_url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteMaterial(material.id!)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Actions for Materials Tab */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t.close}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}