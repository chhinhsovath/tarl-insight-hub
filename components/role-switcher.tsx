"use client"

import { useState } from "react"
import { useAuth, mockUsers } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserIcon } from "lucide-react"

export function RoleSwitcher() {
  const { user, switchUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleSwitchUser = (userId: string) => {
    switchUser(userId)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <UserIcon className="h-4 w-4 mr-1" />
          Switch Role
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch User Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockUsers.map((mockUser) => (
          <DropdownMenuItem
            key={mockUser.id}
            onClick={() => handleSwitchUser(mockUser.id)}
            className={user?.id === mockUser.id ? "bg-muted" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{mockUser.full_name}</span>
              <span className="text-xs text-muted-foreground">{mockUser.role}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
