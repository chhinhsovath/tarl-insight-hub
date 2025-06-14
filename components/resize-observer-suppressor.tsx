'use client'

import { useEffect } from 'react'

export function ResizeObserverSuppressor() {
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.includes?.("ResizeObserver loop completed with undelivered notifications")) {
        return
      }
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return null
} 