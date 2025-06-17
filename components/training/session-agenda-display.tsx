"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface SessionAgendaDisplayProps {
  agenda?: string | null;
  notes?: string | null;
  sessionInfo?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

export function SessionAgendaDisplay({ agenda, notes, sessionInfo }: SessionAgendaDisplayProps) {
  if (!agenda && !notes) {
    return null;
  }

  return (
    <div className="space-y-4">
      {agenda && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: agenda }}
            />
          </CardContent>
        </Card>
      )}

      {notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}