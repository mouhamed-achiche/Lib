/**
 * useLocalStorage Hook
 * Initializes and manages the localStorage database
 */

import { useEffect, useState } from 'react';
import { initializeDatabase } from './storage';
import { setOfflineMode } from './offlineService';
import { checkApiHealth } from './api';

export function useLocalStorage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Initialize localStorage database with defaults
      initializeDatabase();

      // Check API health
      const apiAvailable = await checkApiHealth();
      setIsApiAvailable(apiAvailable);

      // Set offline mode if API is not available
      setOfflineMode(!apiAvailable);

      setIsInitialized(true);
    };

    init();
  }, []);

  return {
    isInitialized,
    isApiAvailable,
  };
}
