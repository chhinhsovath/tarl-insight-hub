"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  className?: string;
}

const colorVariants = {
  blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50",
  green: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50",
  purple: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/50",
  orange: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/50",
  red: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50",
  yellow: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50",
};

const changeVariants = {
  increase: "text-green-600 dark:text-green-400",
  decrease: "text-red-600 dark:text-red-400",
  neutral: "text-gray-600 dark:text-gray-400",
};

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      "p-4 bg-white rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn(
          "p-2 rounded-lg",
          colorVariants[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={cn(
            "text-sm font-medium",
            changeVariants[changeType]
          )}>
            {changeType === 'increase' && '+'}
            {changeType === 'decrease' && '-'}
            {change}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {title}
        </p>
      </div>
    </div>
  );
}