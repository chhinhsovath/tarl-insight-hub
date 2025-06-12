import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Suppress ResizeObserver warnings
export function suppressResizeObserverWarnings() {
  if (typeof window !== "undefined") {
    const originalError = console.error
    console.error = (...args) => {
      if (
        args[0] &&
        typeof args[0] === "string" &&
        args[0].includes("ResizeObserver loop completed with undelivered notifications")
      ) {
        return
      }
      originalError.apply(console, args)
    }
  }
}

// Format date for display
export function formatDate(date: string | Date): string {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "Invalid date"
  }
}

// Format number with commas
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0"
  return num.toLocaleString()
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }) as T
}
