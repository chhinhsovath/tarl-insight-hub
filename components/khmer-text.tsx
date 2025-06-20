"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface KhmerTextProps {
  children: React.ReactNode;
  className?: string;
  element?: keyof JSX.IntrinsicElements;
}

/**
 * Component that automatically applies Hanuman font to Khmer text
 * and detects Khmer Unicode characters
 */
export function KhmerText({ children, className, element = 'span' }: KhmerTextProps) {
  // Check if content contains Khmer Unicode characters (U+1780 to U+17FF)
  const containsKhmer = React.useMemo(() => {
    const text = React.Children.toArray(children).join(' ');
    return /[\u1780-\u17FF]/.test(text);
  }, [children]);

  const Component = element;
  
  return (
    <Component 
      className={cn(
        containsKhmer && 'font-khmer',
        className
      )}
      lang={containsKhmer ? 'km' : undefined}
    >
      {children}
    </Component>
  );
}

/**
 * Khmer-specific heading component
 */
export function KhmerHeading({ 
  children, 
  className, 
  level = 1 
}: { 
  children: React.ReactNode; 
  className?: string; 
  level?: 1 | 2 | 3 | 4 | 5 | 6; 
}) {
  const HeadingElement = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <KhmerText element={HeadingElement} className={cn('khmer-heading', className)}>
      {children}
    </KhmerText>
  );
}

/**
 * Khmer-specific paragraph component
 */
export function KhmerParagraph({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <KhmerText element="p" className={cn('khmer-text', className)}>
      {children}
    </KhmerText>
  );
}