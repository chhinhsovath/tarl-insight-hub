"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingIndicator } from './loading-indicator'
import { useTrainingLoading } from './training-loading-provider'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function LoadingDemo() {
  const [showBasicLoader, setShowBasicLoader] = useState(false)
  const { startLoading, stopLoading, setLoadingMessage } = useTrainingLoading()
  const { isLoading, execute } = useAsyncOperation()

  const simulateBasicLoading = () => {
    setShowBasicLoader(true)
    setTimeout(() => setShowBasicLoader(false), 3000)
  }

  const simulateGlobalLoading = () => {
    setLoadingMessage('Simulating global training load...')
    startLoading()
    setTimeout(() => stopLoading(), 3000)
  }

  const simulateAsyncOperation = async () => {
    await execute(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      return 'Success!'
    }, {
      loadingMessage: 'Processing async operation...',
      showGlobalLoader: true,
      minLoadingTime: 1000
    })
  }

  return (
    <div className="p-6 space-y-4 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold">Loading System Demo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={simulateBasicLoading} disabled={showBasicLoader}>
          {showBasicLoader ? 'Loading...' : 'Basic Loader'}
        </Button>
        
        <Button onClick={simulateGlobalLoading}>
          Global Loader
        </Button>
        
        <Button onClick={simulateAsyncOperation} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Async Operation'}
        </Button>
      </div>

      {/* Basic loader demo */}
      <LoadingIndicator 
        isLoading={showBasicLoader} 
        message="Demo basic loading..." 
        showProgress={true}
      />
    </div>
  )
}