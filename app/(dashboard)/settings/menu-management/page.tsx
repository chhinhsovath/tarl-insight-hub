"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Settings,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Star,
  Pin,
  ExternalLink,
  Badge as BadgeIcon,
  Palette,
  Code,
  Users,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getIconComponent, getIconNames, iconCategories } from "@/lib/icon-utils";

interface MenuManagementPageProps {}

export default function MenuManagementPage({}: MenuManagementPageProps) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("default");

  useEffect(() => {
    if (user) {
      fetchMenuData();
    }
  }, [user]);

  const fetchMenuData = async () => {
    try {
      // Fetch current menu structure
      const menuResponse = await fetch('/api/menu/wordpress-style?grouped=false');
      const menuData = await menuResponse.json();
      setMenuItems(menuData.menu || []);
      
      // Fetch templates
      // This would be a separate API call in a real implementation
      setTemplates([
        { name: 'default', label: 'Default Theme', config: { showIcons: true, showBadges: true } },
        { name: 'compact', label: 'Compact Theme', config: { showIcons: false, showBadges: false } },
        { name: 'admin', label: 'Admin Theme', config: { showIcons: true, showBadges: true, showAdvanced: true } }
      ]);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const MenuItemCard = ({ item }: { item: any }) => {
    const IconComponent = getIconComponent(item.icon_name || 'Circle');
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">{item.page_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.page_path}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.badge_text && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge_text}
                </Badge>
              )}
              {item.external_url && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
              {item.user_customization?.is_pinned && (
                <Pin className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Group</Label>
              <p className="font-medium capitalize">{item.menu_group || 'other'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Level</Label>
              <p className="font-medium">{item.menu_level}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Visibility</Label>
              <div className="flex items-center gap-2">
                {item.is_displayed_in_menu ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-red-600" />
                )}
                <span className="capitalize">{item.menu_visibility}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Actions</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WordPress-Style Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage menu display, permissions, and user customizations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Display Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Control which menu items are visible in the sidebar, separate from access permissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hidden menu items can still be accessed directly if user has permissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Customization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Users can hide, pin, rename menu items and customize ordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4" />
              Conditional Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced rules for showing menus based on roles, features, or conditions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="menu-items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="conditions">Display Conditions</TabsTrigger>
          <TabsTrigger value="user-customizations">User Customizations</TabsTrigger>
        </TabsList>

        <TabsContent value="menu-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Structure</CardTitle>
              <p className="text-sm text-muted-foreground">
                WordPress-style menu management with display control separate from permissions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems.map(item => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Different menu themes and configurations for various user experiences
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map(template => (
                  <Card key={template.name} className={selectedTemplate === template.name ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                      <CardTitle className="text-base">{template.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Icons:</span>
                          <Badge variant={template.config.showIcons ? 'default' : 'secondary'}>
                            {template.config.showIcons ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Badges:</span>
                          <Badge variant={template.config.showBadges ? 'default' : 'secondary'}>
                            {template.config.showBadges ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        {template.config.showAdvanced && (
                          <div className="flex justify-between">
                            <span>Advanced:</span>
                            <Badge variant="default">Enabled</Badge>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant={selectedTemplate === template.name ? 'default' : 'outline'}
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => setSelectedTemplate(template.name)}
                      >
                        {selectedTemplate === template.name ? 'Active' : 'Select'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Conditions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set up conditional display rules for menu items
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Role-Based Display</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Show menu items only to specific roles
                  </p>
                  <div className="flex gap-2">
                    <Badge>Admin Only</Badge>
                    <Badge>Director Only</Badge>
                    <Badge>Coordinator+</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Feature Flags</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Toggle menu items based on feature availability
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Beta Features</Badge>
                    <Badge variant="outline">Advanced Tools</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Time-Based Display</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Show items during specific time periods
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Business Hours</Badge>
                    <Badge variant="outline">Maintenance Window</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-customizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Customizations</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage user-specific menu customizations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Personal Menu Preferences</h3>
                    <Badge>{user?.role}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Hidden Items</Label>
                      <p>3 items hidden</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pinned Items</Label>
                      <p>2 items pinned</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Custom Labels</Label>
                      <p>1 item renamed</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Custom Order</Label>
                      <p>5 items reordered</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-3">Available Customizations</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                      <span>Hide unwanted menu items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pin className="h-4 w-4 text-muted-foreground" />
                      <span>Pin frequently used items to the top</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                      <span>Rename menu items for personal preference</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Reorder menu items by drag and drop</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WordPress-Style Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            WordPress-Style Menu Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Separation of Concerns</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Display control is separate from access permissions</li>
                <li>• Hidden menu items can still be accessed directly</li>
                <li>• Flexible menu organization without security compromise</li>
                <li>• Role-based display with permission-based access</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">User Experience</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Users can customize their navigation experience</li>
                <li>• Progressive disclosure with conditional menus</li>
                <li>• Context-aware menu display</li>
                <li>• Consistent with modern web application patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}