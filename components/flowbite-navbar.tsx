"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTrainingTranslation } from "@/lib/training-i18n";
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Moon,
  Sun,
  Globe
} from "lucide-react";
import { useTheme } from "next-themes";

interface FlowbiteNavbarProps {
  onMenuToggle?: () => void;
}

export function FlowbiteNavbar({ onMenuToggle }: FlowbiteNavbarProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useTrainingTranslation();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
      <div className="px-3 py-2 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Logo and title */}
            <a href="/dashboard" className="flex ml-2 md:mr-24">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <img 
                  src="/favicon.png" 
                  alt="MOEYS Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                TaRL Insight Hub
              </span>
            </a>
          </div>

          {/* Right side items */}
          <div className="flex items-center">
            <div className="flex items-center ml-3 space-x-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Search..."
                />
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Language toggle */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
                className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                title={`Switch to ${language === 'en' ? 'Khmer' : 'English'}`}
              >
                <Globe className="w-5 h-5" />
                <span className={`ml-1 text-xs ${language === 'kh' ? 'font-khmer' : ''}`}>
                  {language === 'en' ? 'EN' : 'ខ្មែរ'}
                </span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No new notifications
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/50">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                </button>

                {/* User dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user?.full_name || user?.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role}
                      </p>
                    </div>
                    <ul className="py-1">
                      <li>
                        <a
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </a>
                      </li>
                      <li>
                        <button
                          onClick={logout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}