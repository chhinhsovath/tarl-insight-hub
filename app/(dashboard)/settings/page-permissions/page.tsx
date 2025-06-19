"use client";

import { useAuth } from "@/lib/auth-context";
import { PageLayout } from "@/components/page-layout";
import { PermissionManager } from "@/components/permission-manager";
import { PageManager } from "@/components/page-manager";
import { MenuOrderManager } from "@/components/menu-order-manager";
import { RoleManager } from "@/components/role-manager";
import { PageTranslationsManager } from "@/components/page-translations-manager";
import { PermissionProtectedRoute } from "@/components/permission-protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PagePermissionsPage() {
  const { user } = useAuth();

  if (!user || user.role.toLowerCase() !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionProtectedRoute>
      <PageLayout
        title="Permission System"
        description="Manage pages and role-based access permissions"
      >
        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="permissions">Permission Management</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="pages">Page Management</TabsTrigger>
            <TabsTrigger value="menu-order">Menu Order</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="permissions">
            <PermissionManager />
          </TabsContent>
          
          <TabsContent value="roles">
            <RoleManager />
          </TabsContent>
          
          <TabsContent value="pages">
            <PageManager />
          </TabsContent>
          
          <TabsContent value="menu-order">
            <MenuOrderManager />
          </TabsContent>
          
          <TabsContent value="translations">
            <PageTranslationsManager />
          </TabsContent>
        </Tabs>
      </PageLayout>
    </PermissionProtectedRoute>
  );
} 