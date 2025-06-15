"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save, GripVertical, RotateCcw, User, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMenu } from '@/lib/menu-context';

interface Page {
  id: number;
  page_name: string;
  page_path: string;
  icon_name: string;
  sort_order?: number;
  user_sort_order?: number;
  category?: string;
}

interface PersonalMenuOrderProps {
  className?: string;
}

// Category mapping based on path patterns
const getCategoryFromPath = (path: string): string => {
  if (path === '/dashboard') return 'overview';
  if (['/schools', '/users', '/students'].includes(path)) return 'management';
  if (['/observations', '/collection', '/visits'].includes(path) || path.startsWith('/observations/')) return 'data';
  if (['/analytics', '/reports', '/progress'].includes(path)) return 'analytics';
  if (['/training'].includes(path)) return 'learning';
  if (['/settings'].includes(path) || path.startsWith('/settings/')) return 'admin';
  return 'other';
};

const categoryLabels = {
  overview: "Overview",
  management: "Management", 
  data: "Data Collection",
  analytics: "Analytics & Reports",
  learning: "Learning",
  admin: "Administration",
  other: "Other"
};

const categoryColors = {
  overview: "bg-blue-50 border-blue-200",
  management: "bg-green-50 border-green-200",
  data: "bg-purple-50 border-purple-200",
  analytics: "bg-orange-50 border-orange-200",
  learning: "bg-pink-50 border-pink-200",
  admin: "bg-gray-50 border-gray-200",
  other: "bg-slate-50 border-slate-200"
};

export function PersonalMenuOrder({ className }: PersonalMenuOrderProps) {
  const { refreshMenu } = useMenu();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [usePersonalOrder, setUsePersonalOrder] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);

  useEffect(() => {
    loadUserMenuOrder();
  }, []);

  const loadUserMenuOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/menu-order');
      if (!response.ok) {
        throw new Error('Failed to fetch user menu order');
      }
      
      const data = await response.json();
      
      // Add category to each page
      const pagesWithCategory = data.pages.map((page: Page) => ({
        ...page,
        category: getCategoryFromPath(page.page_path)
      }));
      
      setPages(pagesWithCategory);
      setUsePersonalOrder(data.usePersonalOrder || false);
      setHasChanges(false);
    } catch (err) {
      setError('Failed to load user menu order');
      console.error('Error loading user menu order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPages(items);
    setHasChanges(true);
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const pageOrders = pages.map((page, index) => ({
        pageId: page.id,
        sortOrder: index + 1
      }));

      const response = await fetch('/api/user/menu-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pageOrders,
          usePersonalOrder 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save menu order');
      }

      setSuccess('Personal menu order saved successfully!');
      setHasChanges(false);
      
      // Refresh the menu in the sidebar
      refreshMenu();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError('Failed to save menu order');
      console.error('Error saving order:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/user/menu-order', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to reset menu order');
      }

      setSuccess('Menu order reset to default!');
      setUsePersonalOrder(false);
      await loadUserMenuOrder(); // Reload the default order
      
      // Refresh the menu in the sidebar
      refreshMenu();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError('Failed to reset menu order');
      console.error('Error resetting order:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetToAlphabetical = () => {
    if (groupByCategory) {
      // Sort alphabetically within each category
      const sortedPages = [...pages].sort((a, b) => {
        if (a.category !== b.category) {
          return (a.category || 'other').localeCompare(b.category || 'other');
        }
        return a.page_name.localeCompare(b.page_name);
      });
      setPages(sortedPages);
    } else {
      // Sort alphabetically overall
      const sortedPages = [...pages].sort((a, b) => a.page_name.localeCompare(b.page_name));
      setPages(sortedPages);
    }
    setHasChanges(true);
  };

  const organizeByCategory = () => {
    if (!groupByCategory) return { 'all': pages };
    
    const grouped = pages.reduce((acc, page) => {
      const category = page.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(page);
      return acc;
    }, {} as Record<string, Page[]>);

    // Sort categories in preferred order
    const categoryOrder = ['overview', 'management', 'data', 'analytics', 'learning', 'admin', 'other'];
    const sortedGrouped: Record<string, Page[]> = {};
    
    categoryOrder.forEach(category => {
      if (grouped[category]) {
        sortedGrouped[category] = grouped[category];
      }
    });

    return sortedGrouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your menu preferences...</span>
      </div>
    );
  }

  const groupedPages = organizeByCategory();

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Personal Menu Order
          </h2>
          <p className="text-muted-foreground mt-1">
            Customize your navigation menu order. Changes only affect your account.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={resetToAlphabetical}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            A-Z Order
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            disabled={saving}
          >
            <Users className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button 
            onClick={saveOrder} 
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Order
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {hasChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes to your personal menu order.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Menu Preferences</CardTitle>
          <CardDescription>
            Configure how your navigation menu is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-personal-order" className="text-base">
                Use Personal Menu Order
              </Label>
              <div className="text-sm text-muted-foreground">
                When enabled, your custom menu order will be used instead of the system default
              </div>
            </div>
            <Switch
              id="use-personal-order"
              checked={usePersonalOrder}
              onCheckedChange={(checked) => {
                setUsePersonalOrder(checked);
                setHasChanges(true);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="group-by-category" className="text-base">
                Group by Category
              </Label>
              <div className="text-sm text-muted-foreground">
                Show menu items grouped by categories (Overview, Management, etc.)
              </div>
            </div>
            <Switch
              id="group-by-category"
              checked={groupByCategory}
              onCheckedChange={setGroupByCategory}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>
            {usePersonalOrder 
              ? "Drag the grip icon to reorder your menu items. This will only affect your navigation." 
              : "Personal ordering is disabled. Enable it above to customize your menu order."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!usePersonalOrder && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Personal menu ordering is currently disabled. Enable "Use Personal Menu Order" above to customize your menu.
              </AlertDescription>
            </Alert>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              {Object.entries(groupedPages).map(([category, categoryPages]) => (
                <div key={category} className="space-y-3">
                  {groupByCategory && category !== 'all' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-sm", categoryColors[category as keyof typeof categoryColors])}>
                        {categoryLabels[category as keyof typeof categoryLabels] || category}
                      </Badge>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                  
                  <Droppable droppableId={category}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {categoryPages.map((page) => {
                          const globalIndex = pages.findIndex(p => p.id === page.id);
                          return (
                            <Draggable 
                              key={page.id} 
                              draggableId={page.id.toString()} 
                              index={globalIndex}
                              isDragDisabled={!usePersonalOrder}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    "flex items-center gap-3 p-4 border rounded-lg bg-white transition-all",
                                    snapshot.isDragging && "shadow-lg",
                                    !usePersonalOrder && "opacity-60"
                                  )}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "text-muted-foreground hover:text-foreground transition-colors",
                                      usePersonalOrder 
                                        ? "cursor-grab active:cursor-grabbing" 
                                        : "cursor-not-allowed"
                                    )}
                                  >
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                  
                                  <div className="flex items-center gap-3 flex-1">
                                    <Badge variant="outline" className="text-xs">
                                      {globalIndex + 1}
                                    </Badge>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{page.page_name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {page.page_path}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {page.icon_name}
                                    </Badge>
                                    {!groupByCategory && page.category && (
                                      <Badge variant="outline" className={cn("text-xs", categoryColors[page.category as keyof typeof categoryColors])}>
                                        {categoryLabels[page.category as keyof typeof categoryLabels]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>
    </div>
  );
}