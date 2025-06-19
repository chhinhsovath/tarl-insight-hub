"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  RefreshCw, 
  Languages,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PagePermission {
  id: number;
  page_name: string;
  page_name_kh?: string;
  page_path: string;
  page_title?: string;
  page_title_kh?: string;
  icon_name?: string;
}

interface TranslationEdit {
  id: number;
  page_name_kh: string;
  page_title_kh: string;
}

export function PageTranslationsManager() {
  const [pages, setPages] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedTranslations, setEditedTranslations] = useState<Map<number, TranslationEdit>>(new Map());

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data/page-permissions');
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      } else {
        toast.error('Failed to fetch pages');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Error loading pages');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationChange = (pageId: number, field: 'page_name_kh' | 'page_title_kh', value: string) => {
    const currentEdit = editedTranslations.get(pageId) || {
      id: pageId,
      page_name_kh: pages.find(p => p.id === pageId)?.page_name_kh || '',
      page_title_kh: pages.find(p => p.id === pageId)?.page_title_kh || ''
    };

    const updatedEdit = { ...currentEdit, [field]: value };
    const newEdits = new Map(editedTranslations);
    newEdits.set(pageId, updatedEdit);
    setEditedTranslations(newEdits);
  };

  const hasChanges = (pageId: number): boolean => {
    const edit = editedTranslations.get(pageId);
    if (!edit) return false;
    
    const page = pages.find(p => p.id === pageId);
    if (!page) return false;

    return edit.page_name_kh !== (page.page_name_kh || '') ||
           edit.page_title_kh !== (page.page_title_kh || '');
  };

  const saveTranslation = async (pageId: number) => {
    const edit = editedTranslations.get(pageId);
    if (!edit || !hasChanges(pageId)) return;

    try {
      setSaving(true);
      const response = await fetch('/api/data/page-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_translation',
          pageId: pageId,
          page_name_kh: edit.page_name_kh,
          page_title_kh: edit.page_title_kh
        })
      });

      if (response.ok) {
        toast.success('Translation saved successfully');
        // Update the local state
        setPages(prev => prev.map(page => 
          page.id === pageId 
            ? { ...page, page_name_kh: edit.page_name_kh, page_title_kh: edit.page_title_kh }
            : page
        ));
        // Clear the edit state for this page
        const newEdits = new Map(editedTranslations);
        newEdits.delete(pageId);
        setEditedTranslations(newEdits);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save translation');
      }
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error('Error saving translation');
    } finally {
      setSaving(false);
    }
  };

  const saveAllTranslations = async () => {
    const changedPages = Array.from(editedTranslations.entries())
      .filter(([pageId]) => hasChanges(pageId));

    if (changedPages.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      const updates = changedPages.map(([pageId, edit]) => ({
        pageId,
        page_name_kh: edit.page_name_kh,
        page_title_kh: edit.page_title_kh
      }));

      const response = await fetch('/api/data/page-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_update_translations',
          updates
        })
      });

      if (response.ok) {
        toast.success(`Saved ${changedPages.length} translations`);
        fetchPages(); // Refresh data
        setEditedTranslations(new Map()); // Clear all edits
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save translations');
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error('Error saving translations');
    } finally {
      setSaving(false);
    }
  };

  const resetTranslation = (pageId: number) => {
    const newEdits = new Map(editedTranslations);
    newEdits.delete(pageId);
    setEditedTranslations(newEdits);
  };

  const getDisplayValue = (pageId: number, field: 'page_name_kh' | 'page_title_kh'): string => {
    const edit = editedTranslations.get(pageId);
    if (edit) {
      return edit[field];
    }
    
    const page = pages.find(p => p.id === pageId);
    return page?.[field] || '';
  };

  const totalChanges = Array.from(editedTranslations.entries())
    .filter(([pageId]) => hasChanges(pageId)).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading page translations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Languages className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Page Translations (Khmer)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage Khmer translations for sidebar navigation items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalChanges > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {totalChanges} unsaved changes
              </Badge>
            )}
            <Button onClick={fetchPages} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={saveAllTranslations} 
              disabled={saving || totalChanges === 0}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All ({totalChanges})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Languages className="h-4 w-4" />
          <AlertDescription>
            These translations will be used in the sidebar navigation when users switch to Khmer language.
            Changes will be applied immediately after saving.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {pages.map((page) => (
            <Card key={page.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{page.page_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {page.page_path}
                      </Badge>
                      {hasChanges(page.id) && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          Modified
                        </Badge>
                      )}
                    </div>
                    {page.page_title && (
                      <p className="text-sm text-muted-foreground">{page.page_title}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasChanges(page.id) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetTranslation(page.id)}
                          className="text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveTranslation(page.id)}
                          disabled={saving}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name_${page.id}`} className="text-sm font-medium">
                      Page Name (Khmer)
                    </Label>
                    <Input
                      id={`name_${page.id}`}
                      value={getDisplayValue(page.id, 'page_name_kh')}
                      onChange={(e) => handleTranslationChange(page.id, 'page_name_kh', e.target.value)}
                      placeholder={`Khmer translation for "${page.page_name}"`}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`title_${page.id}`} className="text-sm font-medium">
                      Page Title (Khmer)
                    </Label>
                    <Input
                      id={`title_${page.id}`}
                      value={getDisplayValue(page.id, 'page_title_kh')}
                      onChange={(e) => handleTranslationChange(page.id, 'page_title_kh', e.target.value)}
                      placeholder={`Khmer translation for "${page.page_title || page.page_name}"`}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pages found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}