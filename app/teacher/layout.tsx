import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { MenuProvider } from "@/lib/menu-context";
import { TrainingLoadingProvider } from "@/components/training-loading-provider";
import { TrainingLocaleProvider } from "@/components/training-locale-provider";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MenuProvider>
      <TrainingLoadingProvider>
        <TrainingLocaleProvider>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </TrainingLocaleProvider>
      </TrainingLoadingProvider>
    </MenuProvider>
  );
}