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
    { value: 'standard', label: 'Standard Training' },
    { value: 'intensive', label: 'Intensive Training' },
    { value: 'refresher', label: 'Refresher Course' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'certification', label: 'Certification Program' },
    { value: 'orientation', label: 'Orientation' },
    { value: 'specialized', label: 'Specialized Training' }
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
      toast.error('Please save the program first before adding materials');
      return;
    }

    const materialName = prompt('Enter a name for this material:');
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
        toast.success('File uploaded successfully!');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown upload error' }));
        console.error('Upload error:', error);
        toast.error(error.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setUploadingFile(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleAddLink = async () => {
    if (!editingProgram?.id) {
      toast.error('Please save the program first before adding materials');
      return;
    }

    if (!newLinkMaterial.material_name || !newLinkMaterial.external_url) {
      toast.error('Material name and URL are required');
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
        toast.success('Link added successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add link');
      }
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Error adding link');
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const response = await fetch(`/api/training/materials?id=${materialId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
        toast.success('Material deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Error deleting material');
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
      toast.error('Program name is required');
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
        toast.success(isEditing ? 'Training program updated successfully!' : 'Training program created successfully!');
        onSuccess();
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', error);
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} training program`);
      }
    } catch (error) {
      console.error('Error creating training program:', error);
      toast.error('Error creating training program');
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
              {editingProgram ? 'Edit Training Program' : 'Create New Training Program'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="materials">Training Materials ({materials.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Program Name */}
                <div className="space-y-2">
                  <Label htmlFor="program_name">Program Name *</Label>
                  <Input
                    id="program_name"
                    value={formData.program_name}
                    onChange={(e) => handleInputChange('program_name', e.target.value)}
                    placeholder="Enter training program name"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter program description"
                    rows={3}
                  />
                </div>

                {/* Program Type */}
                <div className="space-y-2">
                  <Label htmlFor="program_type">Program Type</Label>
                  <Select value={formData.program_type} onValueChange={(value) => handleInputChange('program_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program type" />
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
                  <Label htmlFor="duration_hours">Duration (Hours)</Label>
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
                    Total estimated duration for the entire program
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (editingProgram ? 'Updating...' : 'Creating...') : (editingProgram ? 'Update Program' : 'Create Program')}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="materials" className="space-y-6">
              {!editingProgram?.id && (
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-muted-foreground">
                    Please save the program first to add training materials
                  </p>
                </div>
              )}
              
              {editingProgram?.id && (
                <>
                  {/* Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Add Training Materials</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* File Upload */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Files
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Upload Word, Excel, PowerPoint, PDF, or video files
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
                              <p className="text-sm text-blue-600">Uploading...</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Add Link */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Add Link
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <Input
                              placeholder="Material name"
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
                              {materialsLoading ? 'Adding...' : 'Add Link'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <hr className="my-6" />
                  
                  {/* Materials List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Training Materials ({materials.length})</h3>
                    
                    {materials.length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-muted-foreground">No materials added yet</p>
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
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
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
                  Close
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}