/**
 * LocalStorage Provider
 * Initializes and manages the localStorage database
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeDatabase } from './storage';
import { setOfflineMode } from './offlineService';
import { checkApiHealth } from './api';

interface LocalStorageContextType {
  isInitialized: boolean;
  isApiAvailable: boolean;
  isOfflineMode: boolean;
}

const LocalStorageContext = createContext<LocalStorageContextType | undefined>(undefined);

export function LocalStorageProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [isOfflineMode, setIsOfflineModeSafe] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Initialize localStorage database with defaults
      initializeDatabase();

      // Check API health
      const apiAvailable = await checkApiHealth();
      setIsApiAvailable(apiAvailable);

      // Set offline mode if API is not available
      const offlineMode = !apiAvailable;
      setOfflineMode(offlineMode);
      setIsOfflineModeSafe(offlineMode);

      setIsInitialized(true);
    };

    init();
  }, []);

  return (
    <LocalStorageContext.Provider value={{ isInitialized, isApiAvailable, isOfflineMode }}>
      {children}
    </LocalStorageContext.Provider>
  );
}

export function useLocalStorageContext() {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error('useLocalStorageContext must be used within LocalStorageProvider');
  }
  return context;
}
