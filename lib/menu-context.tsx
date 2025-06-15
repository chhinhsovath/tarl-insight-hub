"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface MenuContextType {
  refreshTrigger: number;
  refreshMenu: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshMenu = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <MenuContext.Provider value={{ refreshTrigger, refreshMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}