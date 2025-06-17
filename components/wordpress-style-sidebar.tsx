"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Settings,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Edit,
  ExternalLink,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getIconComponent } from "@/lib/icon-utils";
import { MenuItem, MenuTemplate } from "@/lib/wordpress-style-menu";

interface WordPressStyleSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  template?: string;
}

export function WordPressStyleSidebar({ 
  open, 
  setOpen, 
  template = "default" 
}: WordPressStyleSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [menuStructure, setMenuStructure] = useState<Record<string, MenuItem[]>>({});
  const [menuTemplate, setMenuTemplate] = useState<MenuTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['overview', 'management']));
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [customizationMode, setCustomizationMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMenuStructure();
    }
  }, [user, template]);

  const fetchMenuStructure = async () => {
    try {
      const response = await fetch(`/api/menu/wordpress-style?grouped=true&template=${template}`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      
      const data = await response.json();
      setMenuStructure(data.menu);
      setMenuTemplate(data.template);
    } catch (error) {
      console.error('Error fetching menu structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemClick = async (item: MenuItem) => {
    // Check if requires confirmation
    if (item.requires_confirmation && item.confirmation_message) {
      const confirmed = window.confirm(item.confirmation_message);
      if (!confirmed) return;
    }

    // Handle external URLs
    if (item.external_url) {
      if (item.opens_in_new_tab) {
        window.open(item.external_url, '_blank');
      } else {
        window.location.href = item.external_url;
      }
      return;
    }

    // Handle navigation
    if (item.page_path && !item.is_parent_menu) {
      // Check access before navigation (WordPress-style)
      const accessResponse = await fetch('/api/menu/wordpress-style/check-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath: item.page_path })
      });
      
      const accessData = await accessResponse.json();
      
      if (accessData.hasAccess) {
        router.push(item.page_path);
        if (window.innerWidth < 768) {
          setOpen(false);
        }
      } else {
        alert('You do not have permission to access this page.');
      }
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const toggleItem = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const saveCustomization = async (pageId: number, customization: any) => {
    try {
      await fetch('/api/menu/wordpress-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, customization })
      });
      fetchMenuStructure(); // Refresh menu
    } catch (error) {
      console.error('Error saving customization:', error);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = pathname === item.page_path;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const IconComponent = getIconComponent(item.icon_name || 'Circle');

    // Handle dividers
    if (item.is_divider) {
      return (
        <div key={item.id} className="px-3 py-2">
          <div className="border-t border-gray-200">
            {item.divider_label && (
              <p className="text-xs text-gray-500 mt-2 font-medium">
                {item.divider_label}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} className={cn("relative", item.css_classes)}>
        <div
          className={cn(
            "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground font-medium",
            level > 0 && "ml-4 pl-6"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start p-0 h-auto font-normal",
              isActive && "font-medium"
            )}
            onClick={() => {
              if (hasChildren && item.is_parent_menu) {
                toggleItem(item.id);
              } else {
                handleMenuItemClick(item);
              }
            }}
          >
            {/* Icon */}
            {menuTemplate?.template_config.showIcons && (
              <div className="flex-shrink-0 mr-3">
                {item.custom_icon_url ? (
                  <img 
                    src={item.custom_icon_url} 
                    alt="" 
                    className="h-4 w-4"
                  />
                ) : (
                  <IconComponent className="h-4 w-4" />
                )}
              </div>
            )}

            {/* Label */}
            <span className="flex-1 text-left truncate">
              {item.user_customization?.custom_label || item.page_name}
            </span>

            {/* Badge */}
            {menuTemplate?.template_config.showBadges && item.badge_text && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-2 h-5 px-1.5 text-xs",
                  item.badge_color === 'red' && "bg-red-100 text-red-800",
                  item.badge_color === 'green' && "bg-green-100 text-green-800",
                  item.badge_color === 'blue' && "bg-blue-100 text-blue-800"
                )}
              >
                {item.badge_text}
              </Badge>
            )}

            {/* External link indicator */}
            {item.external_url && (
              <ExternalLink className="h-3 w-3 ml-2 text-gray-400" />
            )}

            {/* Pinned indicator */}
            {item.user_customization?.is_pinned && (
              <Pin className="h-3 w-3 ml-2 text-yellow-500" />
            )}

            {/* Expand/collapse indicator */}
            {hasChildren && (
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </Button>

          {/* Customization menu */}
          {customizationMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => saveCustomization(item.id, {
                    is_hidden: !item.user_customization?.is_hidden
                  })}
                >
                  {item.user_customization?.is_hidden ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => saveCustomization(item.id, {
                    is_pinned: !item.user_customization?.is_pinned
                  })}
                >
                  {item.user_customization?.is_pinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderMenuGroup = (groupName: string, items: MenuItem[]) => {
    const isExpanded = expandedGroups.has(groupName);
    const groupLabels: Record<string, string> = {
      overview: "Overview",
      management: "Management",
      training: "Training",
      administration: "Administration",
      data_collection: "Data Collection",
      analytics: "Analytics & Reports",
      other: "Other"
    };

    const groupLabel = groupLabels[groupName] || groupName;

    return (
      <div key={groupName} className="mb-2">
        {menuTemplate?.template_config.showGroupLabels && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
            onClick={() => toggleGroup(groupName)}
          >
            <span>{groupLabel}</span>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        {isExpanded && (
          <div className="space-y-1">
            {items.map(item => renderMenuItem(item))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r transition-all duration-300",
        open ? "w-64" : "w-16"
      )}>
        <div className="flex items-center justify-center h-16">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r transition-all duration-300",
        open ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          {open && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomizationMode(!customizationMode)}
                className={cn(customizationMode && "bg-accent")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Menu Content */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.entries(menuStructure).map(([groupName, items]) =>
            renderMenuGroup(groupName, items)
          )}
        </nav>

        {/* Footer */}
        {open && user && (
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}