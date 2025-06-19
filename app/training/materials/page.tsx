"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle,
  BookOpen,
  Video,
  Image,
  FileIcon,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  trainer_name?: string;
}

interface TrainingMaterial {
  id: number;
  material_name: string;
  description: string;
  file_url?: string;
  material_type: string;
  file_size?: string;
  created_at: string;
}

function TrainingMaterialsPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionAndMaterials();
    }
  }, [sessionId]);

  const fetchSessionAndMaterials = async () => {
    try {
      const [sessionResponse, materialsResponse] = await Promise.all([
        fetch(`/api/training/sessions?id=${sessionId}`),
        fetch('/api/data/materials') // Generic materials endpoint
      ]);

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.length > 0) {
          setSession(sessionData[0]);
        }
      }

      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData || []);
      }

      // Log QR code usage
      if (qrId) {
        await fetch(`/api/training/qr-codes?qr_id=${qrId}&session_id=${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'materials_access',
            user_agent: navigator.userAgent,
            scan_data: { access_time: new Date().toISOString() }
          })
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading materials');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (materialType: string) => {
    const type = materialType.toLowerCase();
    if (type.includes('pdf') || type.includes('document')) return FileText;
    if (type.includes('video')) return Video;
    if (type.includes('image')) return Image;
    return FileIcon;
  };

  const getMaterialTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
      'pdf': 'bg-red-100 text-red-800',
      'document': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-orange-100 text-orange-800',
      'video': 'bg-purple-100 text-purple-800',
      'image': 'bg-green-100 text-green-800',
      'handbook': 'bg-indigo-100 text-indigo-800',
      'guide': 'bg-yellow-100 text-yellow-800',
      'template': 'bg-pink-100 text-pink-800'
    };
    return typeMap[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Sample materials for demonstration
  const sampleMaterials: TrainingMaterial[] = [
    {
      id: 1,
      material_name: "TaRL Methodology Handbook",
      description: "Comprehensive guide to Teaching at the Right Level methodology and implementation strategies.",
      material_type: "handbook",
      file_size: "2.3 MB",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      material_name: "Assessment Tools & Templates",
      description: "Ready-to-use assessment tools for determining student learning levels.",
      material_type: "template",
      file_size: "1.8 MB",
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      material_name: "Grouping Strategies Guide",
      description: "Best practices for grouping students by learning level rather than age or grade.",
      material_type: "guide",
      file_size: "1.2 MB",
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      material_name: "TaRL Training Presentation",
      description: "Slide deck covering key concepts and implementation steps.",
      material_type: "presentation",
      file_size: "5.7 MB",
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      material_name: "Sample Lesson Plans",
      description: "Example lesson plans for different learning levels in reading and numeracy.",
      material_type: "document",
      file_size: "3.1 MB",
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      material_name: "Progress Tracking Sheets",
      description: "Templates for tracking student progress throughout the TaRL program.",
      material_type: "template",
      file_size: "0.8 MB",
      created_at: new Date().toISOString()
    }
  ];

  const displayMaterials = materials.length > 0 ? materials : sampleMaterials;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training materials...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</h2>
            <p className="text-gray-600">The training session could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-orange-600 rounded-full p-3 inline-flex mb-4">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Training Materials</h1>
          <p className="text-gray-600 mt-1">Download resources for your training</p>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{session.session_title}</CardTitle>
            <p className="text-sm text-gray-600">{session.program_name}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                {formatDate(session.session_date)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                {formatTime(session.session_time)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                {session.location}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayMaterials.map((material) => {
            const FileIconComponent = getFileIcon(material.material_type);
            
            return (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Material Header */}
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 rounded-lg p-3 flex-shrink-0">
                        <FileIconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {material.material_name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {material.description}
                        </p>
                      </div>
                    </div>

                    {/* Material Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={getMaterialTypeColor(material.material_type)} 
                          variant="secondary"
                        >
                          {material.material_type.toUpperCase()}
                        </Badge>
                        {material.file_size && (
                          <span className="text-xs text-gray-500">
                            {material.file_size}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          if (material.file_url) {
                            window.open(material.file_url, '_blank');
                          } else {
                            toast.info(`${material.material_name} will be available for download soon`);
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (material.file_url) {
                            window.open(material.file_url, '_blank');
                          } else {
                            toast.info(`Preview for ${material.material_name} will be available soon`);
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Download Note */}
                    <p className="text-xs text-gray-500 text-center">
                      Tap Download to save to your device
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Use These Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Download materials before the training session for offline access</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Review the handbook and guides to prepare for the training</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Use templates and tools in your classroom after the training</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p>Share materials with colleagues to spread TaRL methodology</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          These materials are for educational use in implementing TaRL methodology
        </p>
      </div>
    </div>
  );
}

export default function TrainingMaterialsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrainingMaterialsPageContent />
    </Suspense>
  );
}