"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Pencil, Key, Power } from "lucide-react"
import { User } from "@/lib/types"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { DatabaseService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface UserCardProps {
  user: User
  onUpdate: () => void
}

export function UserCard({ user, onUpdate }: UserCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isAllowed } = useAuth()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  
  const isAdmin = isAllowed(['admin'])

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      teacher: "bg-blue-100 text-blue-800",
      collector: "bg-green-100 text-green-800",
      coordinator: "bg-purple-100 text-purple-800",
      partner: "bg-cyan-100 text-cyan-800",
      director: "bg-pink-100 text-pink-800",
      intern: "bg-gray-100 text-gray-800",
    }
    const color = roleColors[role.toLowerCase()] || "bg-gray-100 text-gray-800"
    return (
      <Badge className={color}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`/api/data/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!response.ok) {
        throw new Error("Failed to reset password")
      }
      
      const result = await response.json()
      toast({
        title: "Success",
        description: result.message,
      })
      setShowResetDialog(false)
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async () => {
    try {
      console.log('Toggling user status:', user.id, 'from', user.is_active, 'to', !user.is_active)
      const response = await DatabaseService.updateUser(user.id, { is_active: !user.is_active })
      console.log('Update response:', response)
      toast({
        title: "Success",
        description: `User ${user.is_active ? "deactivated" : "activated"} successfully`,
      })
      setShowToggleDialog(false)
      onUpdate()
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{user.full_name}</CardTitle>
          <div className="flex items-center space-x-2">
            {getRoleBadge(user.role)}
            <Badge
              variant={user.is_active ? "default" : "secondary"}
              className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {user.email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end items-center mt-4 pt-4 border-t space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/users/${user.id}`)}
              className="h-8 w-8"
              title="View User"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResetDialog(true)}
                  className="h-8 w-8"
                  title="Reset Password"
                >
                  <Key className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowToggleDialog(true)}
                  className={`h-8 w-8 ${user.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                  title={user.is_active ? "Deactivate User" : "Activate User"}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reset the password for {user.full_name}? The password will be reset to "12345" and they will need to change it on their next login.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword}>
                  Reset Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{user.is_active ? "Deactivate" : "Activate"} User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to {user.is_active ? "deactivate" : "activate"} {user.full_name}? 
                  {user.is_active ? " They will not be able to log in until reactivated." : " They will be able to log in again."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowToggleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleToggleStatus}>
                  {user.is_active ? "Deactivate" : "Activate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}