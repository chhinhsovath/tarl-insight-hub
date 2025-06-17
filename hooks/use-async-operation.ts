"use client"

import { useState } from 'react'
import { useTrainingLoading } from '@/components/training-loading-provider'

export function useAsyncOperation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { startLoading, stopLoading, setLoadingMessage } = useTrainingLoading()

  const execute = async <T>(
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string
      showGlobalLoader?: boolean
      minLoadingTime?: number
    }
  ): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (options?.showGlobalLoader) {
        startLoading()
        if (options.loadingMessage) {
          setLoadingMessage(options.loadingMessage)
        }
      }

      const startTime = Date.now()
      const result = await operation()
      
      // Ensure minimum loading time for better UX
      const minTime = options?.minLoadingTime || 300
      const elapsed = Date.now() - startTime
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed))
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      console.error('Async operation failed:', error)
      return null
    } finally {
      setIsLoading(false)
      if (options?.showGlobalLoader) {
        stopLoading()
      }
    }
  }

  return {
    isLoading,
    error,
    execute
  }
}