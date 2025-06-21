"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface UniversalLoadingProps {
  isLoading?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  overlay?: boolean;
}

// Get contextual loading message based on current path
const getContextualMessage = (pathname: string) => {
  if (pathname.includes('/training/sessions')) return 'Loading training sessions...';
  if (pathname.includes('/training/programs')) return 'Loading training programs...';
  if (pathname.includes('/training/participants')) return 'Loading participants...';
  if (pathname.includes('/training/qr-codes')) return 'Loading QR codes...';
  if (pathname.includes('/training/feedback')) return 'Loading feedback...';
  if (pathname.includes('/training/attendance')) return 'Loading attendance...';
  if (pathname.includes('/training')) return 'Loading training data...';
  if (pathname.includes('/schools')) return 'Loading schools...';
  if (pathname.includes('/students')) return 'Loading students...';
  if (pathname.includes('/users')) return 'Loading users...';
  if (pathname.includes('/analytics')) return 'Loading analytics...';
  if (pathname.includes('/reports')) return 'Loading reports...';
  if (pathname.includes('/observations')) return 'Loading observations...';
  if (pathname.includes('/settings')) return 'Loading settings...';
  return 'Loading...';
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16'
};

export function UniversalLoading({ 
  isLoading = false, 
  message, 
  size = 'md',
  showProgress = false,
  overlay = true 
}: UniversalLoadingProps) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  
  const loadingMessage = message || getContextualMessage(pathname);

  // Progress bar animation
  useEffect(() => {
    if (isLoading && showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 8;
        });
      }, 200);
      
      return () => {
        clearInterval(interval);
        setProgress(0);
      };
    }
  }, [isLoading, showProgress]);

  // Animated dots
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 600);
      
      return () => {
        clearInterval(interval);
        setDots('');
      };
    }
  }, [isLoading]);

  if (!isLoading) return null;

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Favicon with glare effect */}
      <div className="relative">
        <div className={`${sizeClasses[size]} relative overflow-hidden rounded-full`}>
          {/* Main favicon image */}
          <img 
            src="/favicon.png" 
            alt="Loading" 
            className="w-full h-full object-contain animate-pulse"
          />
          
          {/* Rotating ring around favicon */}
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500 animate-spin`} />
          
          {/* Glare effect overlay */}
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse`} />
          
          {/* Rotating glare sweep */}
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent transform rotate-45 translate-x-full animate-sweep" />
          </div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center space-y-2 min-h-[3rem]">
        <p className="text-sm font-medium text-gray-700">
          {loadingMessage}{dots}
        </p>
        
        {/* Progress Bar (if enabled) */}
        {showProgress && (
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pulsing dots indicator */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 200}ms`,
              animationDuration: '1.2s'
            }}
          />
        ))}
      </div>
    </div>
  );

  if (!overlay) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-sm mx-4 animate-in zoom-in-95 duration-300">
        {content}
      </div>
    </div>
  );
}

// Custom CSS for the sweep animation (add to your global CSS)
const styles = `
@keyframes sweep {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(200%) rotate(45deg);
  }
}

.animate-sweep {
  animation: sweep 2s ease-in-out infinite;
}
`;

// Component that injects the styles
export function UniversalLoadingStyles() {
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  return null;
}