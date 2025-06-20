"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FlowbiteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  outline?: boolean;
  gradient?: boolean;
  pill?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

const baseStyles = "font-medium rounded-lg text-sm focus:ring-4 focus:outline-none transition-colors duration-200";

const variantStyles = {
  primary: {
    solid: "text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    outline: "text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800",
    gradient: "text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-blue-300 dark:focus:ring-blue-800"
  },
  secondary: {
    solid: "text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700",
    outline: "text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 focus:ring-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700",
    gradient: "text-gray-900 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 hover:bg-gradient-to-br focus:ring-gray-200 dark:focus:ring-gray-700"
  },
  success: {
    solid: "text-white bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800",
    outline: "text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800",
    gradient: "text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-green-300 dark:focus:ring-green-800"
  },
  danger: {
    solid: "text-white bg-red-700 hover:bg-red-800 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900",
    outline: "text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900",
    gradient: "text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-red-300 dark:focus:ring-red-800"
  },
  warning: {
    solid: "text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300 dark:focus:ring-yellow-900",
    outline: "text-yellow-400 hover:text-white border border-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-white dark:hover:bg-yellow-400 dark:focus:ring-yellow-900",
    gradient: "text-gray-900 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-500 hover:bg-gradient-to-br focus:ring-yellow-300 dark:focus:ring-yellow-800"
  },
  info: {
    solid: "text-white bg-cyan-700 hover:bg-cyan-800 focus:ring-cyan-300 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-800",
    outline: "text-cyan-700 hover:text-white border border-cyan-700 hover:bg-cyan-800 focus:ring-cyan-300 dark:border-cyan-400 dark:text-cyan-400 dark:hover:text-white dark:hover:bg-cyan-500 dark:focus:ring-cyan-800",
    gradient: "text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-cyan-300 dark:focus:ring-cyan-800"
  },
  dark: {
    solid: "text-white bg-gray-800 hover:bg-gray-900 focus:ring-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700",
    outline: "text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-gray-300 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800",
    gradient: "text-white bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:bg-gradient-to-br focus:ring-gray-300 dark:focus:ring-gray-800"
  },
  light: {
    solid: "text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700",
    outline: "text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700",
    gradient: "text-gray-900 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 hover:bg-gradient-to-br focus:ring-gray-200 dark:focus:ring-gray-700"
  }
};

const sizeStyles = {
  xs: "px-3 py-2 text-xs",
  sm: "px-3 py-2 text-sm",
  base: "px-5 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
  xl: "px-6 py-3.5 text-base"
};

export const FlowbiteButton = forwardRef<HTMLButtonElement, FlowbiteButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'base',
    outline = false,
    gradient = false,
    pill = false,
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const getVariantStyle = () => {
      if (gradient) return variantStyles[variant].gradient;
      if (outline) return variantStyles[variant].outline;
      return variantStyles[variant].solid;
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          getVariantStyle(),
          sizeStyles[size],
          pill && "rounded-full",
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          {Icon && !loading && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && !loading && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </div>
      </button>
    );
  }
);
FlowbiteButton.displayName = "FlowbiteButton";