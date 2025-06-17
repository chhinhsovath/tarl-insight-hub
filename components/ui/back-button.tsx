"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BackButton({ onClick, children, className }: BackButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Button>
  );
}