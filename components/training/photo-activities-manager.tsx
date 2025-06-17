"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Camera, 
  Upload, 
  Edit, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff,
  Calendar,
  Clock,
  MapPin,
  User,
  ImageIcon,
  Plus
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { makeAuthenticatedRequest, handleApiResponse } from '@/lib/session-utils';

interface PhotoActivity {
  id: number;
  session_id: number;
  title: string;
  description?: string;
  photo_path: string;
  photo_name: string;
  photo_size: number;
  photo_type: string;
  activity_date?: string;
  activity_time?: string;
  location?: string;
  uploaded_by: number;
  upload_date: string;
  is_featured: boolean;
  is_public: boolean;
  sort_order: number;
  uploader_name: string;
  uploader_role: number;
}

interface PhotoActivitiesManagerProps {
  sessionId: number;
}

export function PhotoActivitiesManager({ sessionId }: PhotoActivitiesManagerProps) {
  const { user } = useAuth();
  const [photoActivities, setPhotoActivities] = useState<PhotoActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<PhotoActivity | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activityDate: '',
    activityTime: '',
    location: '',
    isFeatured: false,
    isPublic: true,
    photo: null as File | null
  });

  useEffect(() => {
    if (user && sessionId) {
      fetchPhotoActivities();
    }
  }, [user, sessionId]);

  const fetchPhotoActivities = async () => {
    try {
      const response = await makeAuthenticatedRequest(`/api/training/photo-activities?sessionId=${sessionId}`);
      const data = await handleApiResponse<PhotoActivity[]>(response);
      
      if (data) {
        setPhotoActivities(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching photo activities:', error);
      toast.error('Failed to fetch photo activities');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, photo: file }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.photo) {
      toast.error('Title and photo are required');
      return;
    }

    setUploading(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('sessionId', sessionId.toString());
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('activityDate', formData.activityDate);
      uploadFormData.append('activityTime', formData.activityTime);
      uploadFormData.append('location', formData.location);
      uploadFormData.append('isFeatured', formData.isFeatured.toString());
      uploadFormData.append('isPublic', formData.isPublic.toString());
      uploadFormData.append('photo', formData.photo);

      const response = await fetch('/api/training/photo-activities', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        toast.success('Photo uploaded successfully');
        setUploadDialogOpen(false);
        resetForm();
        fetchPhotoActivities();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPhoto || !formData.title) {
      toast.error('Title is required');
      return;
    }

    try {
      const response = await makeAuthenticatedRequest('/api/training/photo-activities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentPhoto.id,
          title: formData.title,
          description: formData.description,
          activityDate: formData.activityDate,
          activityTime: formData.activityTime,
          location: formData.location,
          isFeatured: formData.isFeatured,
          isPublic: formData.isPublic
        })
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        toast.success('Photo updated successfully');
        setEditDialogOpen(false);
        resetForm();
        fetchPhotoActivities();
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Failed to update photo');
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/api/training/photo-activities?id=${photoId}`, {
        method: 'DELETE'
      });

      const result = await handleApiResponse(response);
      
      if (result) {
        toast.success('Photo deleted successfully');
        fetchPhotoActivities();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const openEditDialog = (photo: PhotoActivity) => {
    setCurrentPhoto(photo);
    console.log('Opening edit dialog for photo:', photo);
    console.log('Original activity_date:', photo.activity_date);
    console.log('Formatted activity_date:', formatDateForInput(photo.activity_date));
    
    setFormData({
      title: photo.title,
      description: photo.description || '',
      activityDate: formatDateForInput(photo.activity_date),
      activityTime: photo.activity_time || '',
      location: photo.location || '',
      isFeatured: photo.is_featured,
      isPublic: photo.is_public,
      photo: null
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      activityDate: '',
      activityTime: '',
      location: '',
      isFeatured: false,
      isPublic: true,
      photo: null
    });
    setCurrentPhoto(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    // If the date is already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // If it's in DD/MM/YYYY format, convert it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Try to parse any other date format
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    return '';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading photo activities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Activities
          </CardTitle>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Photo Activity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="photo">Photo *</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max file size: 10MB. Supported formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter photo title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the activity"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activityDate">Activity Date</Label>
                    <Input
                      id="activityDate"
                      type="date"
                      value={formData.activityDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, activityDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="activityTime">Activity Time</Label>
                    <Input
                      id="activityTime"
                      type="time"
                      value={formData.activityTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, activityTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Activity location"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                    />
                    <Label htmlFor="isFeatured">Featured Photo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                    />
                    <Label htmlFor="isPublic">Public Visibility</Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {photoActivities.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photo activities yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload photos to document training activities and share them with participants
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoActivities.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <img 
                    src={`/api/${photo.photo_path}`} 
                    alt={photo.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">Image not found</p>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{photo.title}</h4>
                    <div className="flex items-center gap-1">
                      {photo.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {photo.is_public ? (
                        <Eye className="h-4 w-4 text-green-600" title="Public" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" title="Private" />
                      )}
                    </div>
                  </div>
                  
                  {photo.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    {photo.activity_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(photo.activity_date)}</span>
                        {photo.activity_time && (
                          <>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{formatTime(photo.activity_time)}</span>
                          </>
                        )}
                      </div>
                    )}
                    {photo.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{photo.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{photo.uploader_name}</span>
                    </div>
                    <div className="text-xs">
                      {formatFileSize(photo.photo_size)} • {photo.photo_type}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(photo)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(photo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Photo Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="editTitle">Title *</Label>
              <Input
                id="editTitle"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter photo title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the activity"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editActivityDate">Activity Date</Label>
                <Input
                  id="editActivityDate"
                  type="date"
                  value={formData.activityDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, activityDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editActivityTime">Activity Time</Label>
                <Input
                  id="editActivityTime"
                  type="time"
                  value={formData.activityTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, activityTime: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editLocation">Location</Label>
              <Input
                id="editLocation"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Activity location"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                />
                <Label htmlFor="editIsFeatured">Featured Photo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="editIsPublic">Public Visibility</Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {setEditDialogOpen(false); resetForm();}}>
                Cancel
              </Button>
              <Button type="submit">
                Update Photo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}