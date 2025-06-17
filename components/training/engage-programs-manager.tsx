"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Link,
  Download,
  ExternalLink,
  Clock,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { MaterialsQRCode } from "./materials-qr-code";

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

interface EngageProgramsManagerProps {
  sessionId: number;
  sessionTitle?: string;
  isReadOnly?: boolean;
}

export function EngageProgramsManager({ sessionId, sessionTitle, isReadOnly = false }: EngageProgramsManagerProps) {
  const [programs, setPrograms] = useState<EngageProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState<EngageProgram | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<EngageProgram | null>(null);

  // Form states
  const [programForm, setProgramForm] = useState({
    title: "",
    description: "",
    timing: "before" as "before" | "during" | "after",
    sort_order: 0,
  });

  const [materialForm, setMaterialForm] = useState({
    material_type: "link" as "document" | "link",
    title: "",
    description: "",
    external_url: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchPrograms();
  }, [sessionId]);

  const fetchPrograms = async () => {
    // Add validation to prevent calling API with invalid sessionId
    if (!sessionId || isNaN(sessionId) || sessionId <= 0) {
      console.error("Invalid sessionId:", sessionId);
      setLoading(false);
      setPrograms([]);
      return;
    }

    try {
      console.log("Fetching engage programs for sessionId:", sessionId);
      const response = await fetch(`/api/training/engage-programs?sessionId=${sessionId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch programs");
      }
      const data = await response.json();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load engage programs");
      setPrograms([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async () => {
    try {
      const url = editingProgram
        ? "/api/training/engage-programs"
        : "/api/training/engage-programs";
      const method = editingProgram ? "PUT" : "POST";
      
      const body = editingProgram
        ? { id: editingProgram.id, ...programForm }
        : { session_id: sessionId, ...programForm };

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save program");

      toast.success(editingProgram ? "Program updated" : "Program created");
      setIsAddingProgram(false);
      setEditingProgram(null);
      setProgramForm({
        title: "",
        description: "",
        timing: "before",
        sort_order: 0,
      });
      fetchPrograms();
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("Failed to save program");
    }
  };

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const response = await fetch(`/api/training/engage-programs?id=${programId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) throw new Error("Failed to delete program");

      toast.success("Program deleted");
      fetchPrograms();
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Failed to delete program");
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedProgram) return;

    try {
      const formData = new FormData();
      formData.append("engage_program_id", selectedProgram.id.toString());
      formData.append("material_type", materialForm.material_type);
      formData.append("title", materialForm.title);
      formData.append("description", materialForm.description);
      
      if (materialForm.material_type === "link") {
        formData.append("external_url", materialForm.external_url);
      } else if (materialForm.file) {
        formData.append("file", materialForm.file);
      }

      const response = await fetch("/api/training/engage-materials", {
        method: "POST",
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to add material");

      toast.success("Material added");
      setMaterialForm({
        material_type: "link",
        title: "",
        description: "",
        external_url: "",
        file: null,
      });
      fetchPrograms();
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/training/engage-materials?id=${materialId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) throw new Error("Failed to delete material");

      toast.success("Material deleted");
      fetchPrograms();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
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

  // Early return if sessionId is invalid
  if (!sessionId || isNaN(sessionId) || sessionId <= 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please select a valid training session to manage engage programs.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading engage programs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Engage Programs</h3>
        <div className="flex gap-2">
          {sessionTitle && (
            <MaterialsQRCode sessionId={sessionId} sessionTitle={sessionTitle} />
          )}
          {!isReadOnly && (
          <Dialog open={isAddingProgram} onOpenChange={setIsAddingProgram}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProgram ? "Edit" : "Add"} Engage Program
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={programForm.title}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, title: e.target.value })
                    }
                    placeholder="Program title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={programForm.description}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, description: e.target.value })
                    }
                    placeholder="Program description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="timing">Timing</Label>
                  <Select
                    value={programForm.timing}
                    onValueChange={(value) =>
                      setProgramForm({
                        ...programForm,
                        timing: value as "before" | "during" | "after",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before Training</SelectItem>
                      <SelectItem value="during">During Training</SelectItem>
                      <SelectItem value="after">After Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={programForm.sort_order}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingProgram(false);
                      setEditingProgram(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProgram}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="before" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="before">Before Training</TabsTrigger>
          <TabsTrigger value="during">During Training</TabsTrigger>
          <TabsTrigger value="after">After Training</TabsTrigger>
        </TabsList>

        {["before", "during", "after"].map((timing) => (
          <TabsContent key={timing} value={timing} className="space-y-4">
            {programs
              .filter((p) => p.timing === timing)
              .map((program) => (
                <Card key={program.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span
                            className={`p-1 rounded ${getTimingColor(program.timing)}`}
                          >
                            {getTimingIcon(program.timing)}
                          </span>
                          {program.title}
                        </CardTitle>
                        {program.description && (
                          <p className="text-sm text-muted-foreground">
                            {program.description}
                          </p>
                        )}
                      </div>
                      {!isReadOnly && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProgram(program);
                              setProgramForm({
                                title: program.title,
                                description: program.description || "",
                                timing: program.timing,
                                sort_order: program.sort_order,
                              });
                              setIsAddingProgram(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProgram(program.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {program.materials.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {material.material_type === "document" ? (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Link className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{material.title}</p>
                              {material.description && (
                                <p className="text-sm text-muted-foreground">
                                  {material.description}
                                </p>
                              )}
                              {material.file_size && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(material.file_size)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {material.download_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {material.download_count} downloads
                              </span>
                            )}
                            {material.material_type === "link" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(material.external_url, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = material.file_path!;
                                  link.download = material.file_name!;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {!isReadOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMaterial(material.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setSelectedProgram(program)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Material
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Material</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="material_type">Type</Label>
                                <Select
                                  value={materialForm.material_type}
                                  onValueChange={(value) =>
                                    setMaterialForm({
                                      ...materialForm,
                                      material_type: value as "document" | "link",
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="link">External Link</SelectItem>
                                    <SelectItem value="document">
                                      Document Upload
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="material_title">Title</Label>
                                <Input
                                  id="material_title"
                                  value={materialForm.title}
                                  onChange={(e) =>
                                    setMaterialForm({
                                      ...materialForm,
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Material title"
                                />
                              </div>
                              <div>
                                <Label htmlFor="material_description">
                                  Description
                                </Label>
                                <Textarea
                                  id="material_description"
                                  value={materialForm.description}
                                  onChange={(e) =>
                                    setMaterialForm({
                                      ...materialForm,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Material description"
                                  rows={2}
                                />
                              </div>
                              {materialForm.material_type === "link" ? (
                                <div>
                                  <Label htmlFor="external_url">URL</Label>
                                  <Input
                                    id="external_url"
                                    type="url"
                                    value={materialForm.external_url}
                                    onChange={(e) =>
                                      setMaterialForm({
                                        ...materialForm,
                                        external_url: e.target.value,
                                      })
                                    }
                                    placeholder="https://example.com"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <Label htmlFor="file">File</Label>
                                  <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) =>
                                      setMaterialForm({
                                        ...materialForm,
                                        file: e.target.files?.[0] || null,
                                      })
                                    }
                                  />
                                </div>
                              )}
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancel</Button>
                                <Button onClick={handleAddMaterial}>
                                  Add Material
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>
        </div>
    </div>
  );
}