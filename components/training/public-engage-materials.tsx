"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Link,
  Download,
  ExternalLink,
  Clock,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: number;
  material_type: "document" | "link";
  title: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  external_url?: string;
  download_count: number;
  is_active: boolean;
}

interface EngageProgram {
  id: number;
  session_id: number;
  title: string;
  description?: string;
  timing: "before" | "during" | "after";
  sort_order: number;
  is_active: boolean;
  materials: Material[];
}

interface PublicEngageMaterialsProps {
  sessionId: number;
  participantId?: number;
  sessionInfo?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

export function PublicEngageMaterials({ 
  sessionId, 
  participantId,
  sessionInfo 
}: PublicEngageMaterialsProps) {
  const [programs, setPrograms] = useState<EngageProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, [sessionId]);

  const fetchPrograms = async () => {
    try {
      // Use public API endpoint that doesn't require authentication
      const response = await fetch(`/api/training/public/engage-programs?sessionId=${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch programs");
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load training materials");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    setDownloading(material.id);
    try {
      // Use public download endpoint that doesn't require authentication
      const response = await fetch("/api/training/public/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: material.id,
          participantId: participantId,
        }),
      });

      if (!response.ok) throw new Error("Failed to process download");

      const data = await response.json();

      if (data.type === "redirect") {
        window.open(data.url, "_blank");
      } else if (data.type === "download") {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = data.filename;
        link.click();
      }

      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading material:", error);
      toast.error("Failed to download material");
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTimingIcon = (timing: string) => {
    switch (timing) {
      case "before":
        return <Clock className="h-4 w-4" />;
      case "during":
        return <Calendar className="h-4 w-4" />;
      case "after":
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case "before":
        return "text-blue-600 bg-blue-50";
      case "during":
        return "text-green-600 bg-green-50";
      case "after":
        return "text-purple-600 bg-purple-50";
      default:
        return "";
    }
  };

  const getTimingLabel = (timing: string) => {
    switch (timing) {
      case "before":
        return "Pre-Training";
      case "during":
        return "During Training";
      case "after":
        return "Post-Training";
      default:
        return timing;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasMaterials = programs.some(p => p.materials.length > 0);

  if (!hasMaterials) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No materials are available for this training session yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sessionInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{sessionInfo.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{sessionInfo.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">{sessionInfo.time}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{sessionInfo.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training Materials</CardTitle>
          <p className="text-sm text-muted-foreground">
            Download the materials relevant to your training stage
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {["before", "during", "after"].map((timing) => {
                const programsForTiming = programs.filter(p => p.timing === timing);
                const materialsCount = programsForTiming.reduce(
                  (acc, p) => acc + p.materials.length, 
                  0
                );
                
                return (
                  <TabsTrigger 
                    key={timing} 
                    value={timing}
                    disabled={materialsCount === 0}
                    className="relative"
                  >
                    {getTimingLabel(timing)}
                    {materialsCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 h-5 px-1 text-xs"
                      >
                        {materialsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {["before", "during", "after"].map((timing) => (
              <TabsContent key={timing} value={timing} className="space-y-4 mt-6">
                {programs
                  .filter((p) => p.timing === timing && p.materials.length > 0)
                  .map((program) => (
                    <div key={program.id} className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`p-1 rounded ${getTimingColor(program.timing)}`}
                        >
                          {getTimingIcon(program.timing)}
                        </span>
                        <h3 className="font-semibold">{program.title}</h3>
                      </div>
                      {program.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {program.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {program.materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {material.material_type === "document" ? (
                                <div className="p-2 rounded-lg bg-orange-50">
                                  <FileText className="h-5 w-5 text-orange-600" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-blue-50">
                                  <Link className="h-5 w-5 text-blue-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{material.title}</p>
                                {material.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {material.description}
                                  </p>
                                )}
                                <div className="flex gap-4 mt-1">
                                  {material.file_size && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(material.file_size)}
                                    </span>
                                  )}
                                  {material.download_count > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {material.download_count} downloads
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={material.material_type === "link" ? "outline" : "default"}
                              onClick={() => handleDownload(material)}
                              disabled={downloading === material.id}
                            >
                              {downloading === material.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : material.material_type === "link" ? (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                {programs.filter(p => p.timing === timing && p.materials.length > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No materials available for this stage
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}