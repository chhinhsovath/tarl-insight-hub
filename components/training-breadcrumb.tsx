"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function TrainingBreadcrumb() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Training Hub', href: '/training' }
    ];

    if (pathname === '/training') return breadcrumbs;

    // Training sub-pages
    if (pathname.startsWith('/training/sessions')) {
      breadcrumbs.push({ label: 'Training Sessions', href: '/training/sessions' });
      
      if (pathname.includes('/new')) {
        breadcrumbs.push({ label: 'New Session', href: pathname });
      } else if (pathname.includes('/edit')) {
        breadcrumbs.push({ label: 'Edit Session', href: pathname });
      }
    } else if (pathname.startsWith('/training/programs')) {
      breadcrumbs.push({ label: 'Training Programs', href: '/training/programs' });
    } else if (pathname.startsWith('/training/participants')) {
      breadcrumbs.push({ label: 'Participants', href: '/training/participants' });
    } else if (pathname.startsWith('/training/qr-codes')) {
      breadcrumbs.push({ label: 'QR Codes', href: '/training/qr-codes' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.href}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{breadcrumb.label}</span>
          ) : (
            <Link 
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}