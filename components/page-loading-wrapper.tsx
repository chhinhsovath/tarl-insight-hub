"use client"

import { useState, useEffect, ReactNode } from 'react'
import { LoadingIndicator } from './loading-indicator'

interface PageLoadingWrapperProps {
  children: ReactNode
  loadingDelay?: number
  showProgress?: boolean
}

export function PageLoadingWrapper({ 
  children, 
  loadingDelay = 300,
  showProgress = false 
}: PageLoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Show loading indicator for a minimum time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
      setShowContent(true)
    }, loadingDelay)

    return () => clearTimeout(timer)
  }, [loadingDelay])

  return (
    <>
      <LoadingIndicator isLoading={isLoading} showProgress={showProgress} />
      <div 
        className={`transition-opacity duration-300 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
      </div>
    </>
  )
}