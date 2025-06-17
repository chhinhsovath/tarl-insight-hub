"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2, BookOpen, Users, Calendar, QrCode, MessageSquare } from 'lucide-react'
import { useTrainingTranslation } from '@/lib/training-i18n'

interface LoadingIndicatorProps {
  isLoading?: boolean
  message?: string
  showProgress?: boolean
}

// Get appropriate icon based on current path
const getPathIcon = (pathname: string) => {
  if (pathname.includes('/training/sessions')) return Calendar
  if (pathname.includes('/training/programs')) return BookOpen
  if (pathname.includes('/training/participants')) return Users
  if (pathname.includes('/training/qr-codes')) return QrCode
  if (pathname.includes('/training/feedback')) return MessageSquare
  if (pathname.includes('/training')) return BookOpen
  return Loader2
}

// Get loading message based on current path using localized translations
const getLoadingMessage = (pathname: string, t: any) => {
  if (pathname.includes('/training/sessions')) return t.loadingTrainingSessions
  if (pathname.includes('/training/programs')) return t.loadingTrainingPrograms
  if (pathname.includes('/training/participants')) return t.loadingParticipants
  if (pathname.includes('/training/qr-codes')) return t.loadingQrCodes
  if (pathname.includes('/training/feedback')) return t.loadingFeedback
  if (pathname.includes('/training')) return t.loadingTrainingOverview
  return t.loading
}

export function LoadingIndicator({ isLoading = false, message, showProgress = false }: LoadingIndicatorProps) {
  const pathname = usePathname()
  const { t } = useTrainingTranslation()
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')
  
  const Icon = getPathIcon(pathname)
  const loadingMessage = message || getLoadingMessage(pathname, t)

  // Progress bar animation
  useEffect(() => {
    if (isLoading && showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
      
      return () => {
        clearInterval(interval)
        setProgress(0)
      }
    }
  }, [isLoading, showProgress])

  // Animated dots
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return ''
          return prev + '.'
        })
      }, 500)
      
      return () => {
        clearInterval(interval)
        setDots('')
      }
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg border p-8 flex flex-col items-center space-y-6 max-w-sm mx-4 animate-in zoom-in-95 duration-300">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Icon className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          
          {/* Spinning ring */}
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{loadingMessage}</h3>
          <p className="text-sm text-gray-500">{t.pleaseWait}{dots}</p>
        </div>

        {/* Progress Bar (if enabled) */}
        {showProgress && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t.loading.replace('...', '')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Pulsing dots */}
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}