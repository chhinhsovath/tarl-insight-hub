"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingIndicator } from './loading-indicator'

interface LoadingContextType {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
  setLoadingMessage: (message: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface TrainingLoadingProviderProps {
  children: ReactNode
}

export function TrainingLoadingProvider({ children }: TrainingLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const pathname = usePathname()

  // Auto-loading on route change for training pages
  useEffect(() => {
    if (pathname.startsWith('/training') || pathname.startsWith('/(dashboard)/training')) {
      setIsLoading(true)
      
      // Simulate loading time - this creates a better UX
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [pathname])

  const startLoading = () => setIsLoading(true)
  const stopLoading = () => setIsLoading(false)

  const value = {
    isLoading,
    startLoading,
    stopLoading,
    setLoadingMessage
  }

  return (
    <LoadingContext.Provider value={value}>
      <LoadingIndicator 
        isLoading={isLoading} 
        message={loadingMessage || undefined}
        showProgress={true}
      />
      {children}
    </LoadingContext.Provider>
  )
}

export function useTrainingLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useTrainingLoading must be used within a TrainingLoadingProvider')
  }
  return context
}