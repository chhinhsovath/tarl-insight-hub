"use client"

import { LoadingIndicator } from './loading-indicator'

interface PageLoaderProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
}

export function PageLoader({ isLoading, message, children }: PageLoaderProps) {
  return (
    <>
      {isLoading && <LoadingIndicator isLoading={true} message={message} showProgress={false} />}
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
    </>
  )
}