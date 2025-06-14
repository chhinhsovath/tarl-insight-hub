"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Session {
  id: number
  token: string
  created_at: string
  expires_at: string
  last_activity_at: string
}

interface SessionListProps {
  userId: number
}

export function SessionList({ userId }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [terminatingSession, setTerminatingSession] = useState<number | null>(null)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSessions()
  }, [userId])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const data = await DatabaseService.getUserSessions(userId)
      setSessions(data)
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: number) => {
    setTerminatingSession(sessionId)
    setShowTerminateDialog(true)
  }

  const confirmTerminateSession = async () => {
    if (!terminatingSession) return

    try {
      await DatabaseService.terminateSession(userId, terminatingSession)
      toast({
        title: "Success",
        description: "Session terminated successfully",
      })
      loadSessions()
    } catch (error) {
      console.error("Error terminating session:", error)
      toast({
        title: "Error",
        description: "Failed to terminate session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTerminatingSession(null)
      setShowTerminateDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isCurrentSession = (token: string) => {
    return token === document.cookie.split("; ").find((row) => row.startsWith("session_token="))?.split("=")[1]
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-500">No active sessions</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {isCurrentSession(session.token) ? "Current Session" : "Other Session"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last activity: {formatDate(session.last_activity_at)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires: {formatDate(session.expires_at)}
                    </p>
                  </div>
                  {!isCurrentSession(session.token) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTerminateSession(session.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this session? The user will be logged out from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTerminateSession}
              className="bg-red-500 hover:bg-red-600"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 