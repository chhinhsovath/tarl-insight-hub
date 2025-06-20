"use client";

import { useState } from "react";
import { FlowbiteSidebar } from "@/components/flowbite-sidebar";
import { FlowbiteNavbar } from "@/components/flowbite-navbar";

interface FlowbiteLayoutProps {
  children: React.ReactNode;
}

export function FlowbiteLayout({ children }: FlowbiteLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <FlowbiteNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Sidebar */}
      <FlowbiteSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Main content */}
      <div className="pt-16 lg:ml-64">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}