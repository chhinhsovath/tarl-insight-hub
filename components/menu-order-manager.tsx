"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, GripVertical, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Page {
  id: number;
  page_name: string;
  page_path: string;
  icon_name: string;
  sort_order?: number;
}

interface MenuOrderManagerProps {
  className?: string;
}

export function MenuOrderManager({ className }: MenuOrderManagerProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/data/page-permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      
      const data = await response.json();
      setPages(data);
      setHasChanges(false);
    } catch (err) {
      setError('Failed to load pages');
      console.error('Error loading pages:', err);
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
        id: page.id,
        sort_order: index + 1
      }));

      const response = await fetch('/api/data/menu-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageOrders })
      });

      if (!response.ok) {
        throw new Error('Failed to save menu order');
      }

      setSuccess('Menu order saved successfully!');
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError('Failed to save menu order');
      console.error('Error saving order:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetOrder = () => {
    // Reset to alphabetical order
    const sortedPages = [...pages].sort((a, b) => a.page_name.localeCompare(b.page_name));
    setPages(sortedPages);
    setHasChanges(true);
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
          <h2 className="text-2xl font-bold">Menu Order Management</h2>
          <p className="text-muted-foreground">
            Drag and drop to reorder menu items. Changes affect all users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={resetOrder}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to A-Z
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
            You have unsaved changes. Don't forget to save your new menu order.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>
            Drag the grip icon to reorder menu items. The order will be reflected in the sidebar navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pages">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {pages.map((page, index) => (
                    <Draggable 
                      key={page.id} 
                      draggableId={page.id.toString()} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-3 p-4 border rounded-lg bg-white transition-shadow",
                            snapshot.isDragging && "shadow-lg"
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <div className="flex flex-col">
                              <span className="font-medium">{page.page_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {page.page_path}
                              </span>
                            </div>
                          </div>
                          
                          <Badge variant="secondary" className="text-xs">
                            {page.icon_name}
                          </Badge>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>
    </div>
  );
}