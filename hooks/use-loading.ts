"use client"

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Start loading when route changes
    setIsLoading(true)
    
    // Simulate minimum loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  const startLoading = () => setIsLoading(true)
  const stopLoading = () => setIsLoading(false)

  return {
    isLoading,
    startLoading,
    stopLoading
  }
}