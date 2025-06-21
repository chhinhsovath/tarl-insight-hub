"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalLoading } from '@/lib/global-loading-context';

export function NavigationLoading() {
  const pathname = usePathname();
  const { showLoading, hideLoading } = useGlobalLoading();
  const previousPathname = useRef<string | null>(null);
  const loadingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
    }

    // If this is a route change (not initial load)
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      showLoading("Loading page...");
      
      // Hide loading after a short delay to allow page to render
      loadingTimer.current = setTimeout(() => {
        hideLoading();
      }, 800);
    } else {
      // For initial page load, just update the ref
      previousPathname.current = pathname;
    }

    // Update the previous pathname for next comparison
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
    }

    return () => {
      if (loadingTimer.current) {
        clearTimeout(loadingTimer.current);
      }
    };
  }, [pathname, showLoading, hideLoading]);

  // Add click listeners to all navigation links
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href.includes(window.location.origin)) {
        const href = link.getAttribute('href');
        if (href && href !== pathname && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          showLoading("Loading page...");
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [pathname, showLoading]);

  return null;
}