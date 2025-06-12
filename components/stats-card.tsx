"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-blue-500",
  trend,
}: StatsCardProps) {
  // Safely format the value
  const formatValue = (val: string | number) => {
    if (val === null || val === undefined) return "0"
    if (typeof val === "number") {
      // Check if it's a valid number before calling toFixed
      return isNaN(val) ? "0" : val.toString()
    }
    return val.toString()
  }

  // Safely format trend value
  const formatTrend = (trendValue: number) => {
    if (trendValue === null || trendValue === undefined || isNaN(trendValue)) return "0"
    return trendValue.toString()
  }

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          {trend && (
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              <span>
                {trend.isPositive ? "+" : ""}
                {formatTrend(trend.value)}%
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
            {formatValue(value)}
          </p>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
