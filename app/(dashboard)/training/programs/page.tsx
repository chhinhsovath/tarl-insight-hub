"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardList, 
  Settings,
  Plus,
  Search,
  Filter,
  BookOpen,
  Clock,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  Paperclip
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import TrainingProgramForm from '@/components/training-program-form';
import { TrainingBreadcrumb } from '@/components/training-breadcrumb';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { TrainingLanguageSwitcher } from '@/components/training-language-switcher';
import { useTrainingTranslation } from '@/lib/training-i18n';

interface TrainingProgram {
  id: number;
  program_name: string;
  description: string;
  program_type: string;
  duration_hours: number;
  session_count: number;
  total_participants: number;
  materials_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function TrainingProgramsPageContent() {
  const { user } = useAuth();
  const { t } = useTrainingTranslation();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [programs, searchTerm, typeFilter]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/training/programs', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Ensure data is an array and all programs have valid program_type
        const validPrograms = Array.isArray(data) ? data.map(program => ({
          ...program,
          program_type: program.program_type || 'standard'
        })) : [];
        
        setPrograms(validPrograms);
      } else {
        toast.error(t.failedToFetch);
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error(t.errorLoading);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = programs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(program =>
        program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.program_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(program => program.program_type === typeFilter);
    }

    setFilteredPrograms(filtered);
  };

  const handleProgramFormSuccess = () => {
    setShowProgramForm(false);
    setEditingProgram(null);
    fetchPrograms();
  };

  const handleEditProgram = (program: TrainingProgram) => {
    setEditingProgram(program);
    setShowProgramForm(true);
  };

  const handleCancelProgramForm = () => {
    setShowProgramForm(false);
    setEditingProgram(null);
  };

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm(t.deleteConfirmation)) {
      return;
    }

    try {
      const response = await fetch(`/api/training/programs?id=${programId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success(t.deleteSuccess);
        fetchPrograms();
      } else {
        const error = await response.json();
        toast.error(error.error || t.deleteFailed);
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(t.deleteError);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.pleaseLogIn} {t.trainingPrograms.toLowerCase()}.</p>
      </div>
    );
  }

  const canCreatePrograms = ['admin', 'director', 'partner'].includes(user.role);
  const uniqueTypes = [...new Set(programs.map(p => p.program_type).filter(Boolean))];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgramTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'standard': 'bg-blue-100 text-blue-800',
      'intensive': 'bg-red-100 text-red-800',
      'refresher': 'bg-green-100 text-green-800',
      'workshop': 'bg-purple-100 text-purple-800',
      'seminar': 'bg-yellow-100 text-yellow-800',
      'certification': 'bg-orange-100 text-orange-800',
      'orientation': 'bg-teal-100 text-teal-800',
      'specialized': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <TrainingBreadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold">{t.trainingPrograms}</h1>
          <p className="text-muted-foreground mt-1">
            {t.programsDescription}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TrainingLanguageSwitcher />
          {/* <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge> */}
          {canCreatePrograms && (
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowProgramForm(true)}
            >
              <Plus className="h-4 w-4" />
              {t.createProgram}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalPrograms}</p>
                <p className="text-2xl font-bold">{programs.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalSessions}</p>
                <p className="text-2xl font-bold">
                  {programs.reduce((sum, program) => {
                    const count = program.session_count;
                    const numericCount = typeof count === 'string' ? parseInt(count, 10) : (count || 0);
                    return sum + numericCount;
                  }, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalParticipants}</p>
                <p className="text-2xl font-bold">
                  {programs.reduce((sum, program) => {
                    const count = program.total_participants;
                    const numericCount = typeof count === 'string' ? parseInt(count, 10) : (count || 0);
                    return sum + numericCount;
                  }, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.avgDuration}</p>
                <p className="text-2xl font-bold">
                  {programs.length > 0 
                    ? Math.round(programs.reduce((sum, p) => sum + p.duration_hours, 0) / programs.length)
                    : 0}{t.hour}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t.searchPrograms}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.type} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes}</SelectItem>
                  {!loading && uniqueTypes.filter(type => type && type.trim()).map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trainingPrograms} ({filteredPrograms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t.loadingPrograms}</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {programs.length === 0 ? t.noProgramsFound : t.noMatchingFilters}
              </p>
              {canCreatePrograms && programs.length === 0 && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => setShowProgramForm(true)}
                >
                  {t.createFirstProgram}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">{program.program_name}</h3>
                          <Badge 
                            className={getProgramTypeColor(program.program_type)} 
                            variant="secondary"
                          >
                            {program.program_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {program.description || t.noDescriptionAvailable}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{program.duration_hours}{t.hour} {t.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{program.session_count} {t.sessions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{program.total_participants} {t.participants}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span>{program.materials_count || 0} {t.materials}</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {t.created}: {formatDate(program.created_at)}
                        {program.updated_at !== program.created_at && (
                          <span> • {t.updated}: {formatDate(program.updated_at)}</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          {t.viewDetails}
                        </Button>
                        {canCreatePrograms && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditProgram(program)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteProgram(program.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              {t.delete}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Form Modal */}
      {showProgramForm && (
        <TrainingProgramForm
          editingProgram={editingProgram}
          onSuccess={handleProgramFormSuccess}
          onCancel={handleCancelProgramForm}
        />
      )}
    </div>
  );
}

export default function TrainingProgramsPage() {
  return (
    <TrainingLocaleProvider>
      <TrainingProgramsPageContent />
    </TrainingLocaleProvider>
  );
}