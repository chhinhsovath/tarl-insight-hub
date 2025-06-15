"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Globe,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { DatabaseService } from '@/lib/database';
import { Page } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PageManagerProps {
  className?: string;
}

export function PageManager({ className }: PageManagerProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    description: ''
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const pagesData = await DatabaseService.getPages();
      setPages(pagesData);
    } catch (err) {
      setError('Failed to load pages');
      console.error('Error loading pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.path) {
      setError('Name and path are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/data/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }

      setSuccess('Page created successfully');
      setFormData({ name: '', path: '', description: '' });
      setShowAddDialog(false);
      await loadPages();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', path: '', description: '' });
    setEditingPage(null);
    setError(null);
  };

  const getPathIcon = (path: string) => {
    if (path.includes('dashboard')) return '📊';
    if (path.includes('users')) return '👥';
    if (path.includes('schools')) return '🏫';
    if (path.includes('students')) return '🎓';
    if (path.includes('observations')) return '👁️';
    if (path.includes('reports')) return '📋';
    if (path.includes('analytics')) return '📈';
    if (path.includes('settings')) return '⚙️';
    if (path.includes('training')) return '📚';
    if (path.includes('collection')) return '📝';
    if (path.includes('visits')) return '📍';
    if (path.includes('progress')) return '📊';
    return '📄';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pages...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Page Management
          </h2>
          <p className="text-muted-foreground">
            Manage pages and resources in the permission system
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Page</DialogTitle>
              <DialogDescription>
                Create a new page that can be managed through the permission system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Page Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., User Management"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="path">Page Path</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="e.g., /users/management"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Should start with "/" and match your route structure
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this page does..."
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Page
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Card key={page.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-xl">{getPathIcon(page.path)}</span>
                {page.name}
              </CardTitle>
              <CardDescription>
                {page.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {page.path}
                  </code>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div>Created: {new Date(page.created_at).toLocaleDateString()}</div>
                  {page.updated_at && (
                    <div>Updated: {new Date(page.updated_at).toLocaleDateString()}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pages found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first page to the permission system.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Page
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}