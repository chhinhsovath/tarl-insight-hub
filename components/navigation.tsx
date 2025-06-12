"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Home, Users, Star, School } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Schools", href: "/schools", icon: School },
  { name: "Users", href: "/users", icon: Users },
  { name: "Surveys", href: "/surveys", icon: FileText },
  { name: "Training", href: "/training", icon: Star },
  { name: "Reports", href: "/reports", icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={pathname === item.href ? "default" : "ghost"}
              className={cn("w-full justify-start", pathname === item.href && "bg-primary text-primary-foreground")}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
