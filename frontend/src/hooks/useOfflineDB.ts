/**
 * useOfflineDB Hook
 * Initialize and manage localStorage database with offline capabilities
 */

import { useEffect, useState, useCallback } from 'react';
import { initializeDatabase, syncStorage } from '../lib/localStorage';
import { api } from '../lib/offlineApi';

export interface OfflineDBState {
  isInitialized: boolean;
  isOnline: boolean;
  hasBackend: boolean;
  lastSync: number;
  error: string | null;
}

export const useOfflineDB = () => {
  const [state, setState] = useState<OfflineDBState>({
    isInitialized: false,
    isOnline: navigator.onLine,
    hasBackend: false,
    lastSync: 0,
    error: null,
  });

  // Initialize database on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize localStorage database with defaults
        initializeDatabase();

        // Check backend availability
        await api.init();

        setState(prev => ({
          ...prev,
          isInitialized: true,
          lastSync: Date.now(),
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Initialization failed',
        }));
      }
    };

    initialize();
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      syncStorage.setSyncStatus('online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      syncStorage.setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync data with backend when online
  const sync = useCallback(async () => {
    if (!state.isOnline || !state.hasBackend) {
      return {
        success: false,
        message: 'Backend not available',
      };
    }

    try {
      // Sync logic would go here
      // For now, just update last sync time
      syncStorage.setLastSync(Date.now());

      return {
        success: true,
        message: 'Sync completed',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }, [state.isOnline, state.hasBackend]);

  return {
    ...state,
    sync,
    isReady: state.isInitialized,
  };
};

export default useOfflineDB;
