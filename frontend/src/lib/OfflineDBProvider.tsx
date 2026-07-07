/**
 * OfflineDB Provider
 * Provides offline database initialization to the entire app
 */

import React, { createContext, useContext } from 'react';
import useOfflineDB, { OfflineDBState } from '../hooks/useOfflineDB';

interface OfflineDBContextType extends OfflineDBState {
  sync: () => Promise<any>;
  isReady: boolean;
}

const OfflineDBContext = createContext<OfflineDBContextType | undefined>(undefined);

export interface OfflineDBProviderProps {
  children: React.ReactNode;
}

export const OfflineDBProvider: React.FC<OfflineDBProviderProps> = ({ children }) => {
  const offlineDB = useOfflineDB();

  if (!offlineDB.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <OfflineDBContext.Provider value={offlineDB}>
      {offlineDB.error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Warning: {offlineDB.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {!offlineDB.isOnline && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 0 1 5.11 2.523a6 6 0 0 1 8.367 8.368zm1.414-1.414A8 8 0 1 1 2.172 2.172a8 8 0 0 1 11.314 11.314zM9 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-7a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0V5a1 1 0 0 0-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                You are currently offline. Using local storage mode.
              </p>
            </div>
          </div>
        </div>
      )}

      {children}
    </OfflineDBContext.Provider>
  );
};

export const useOfflineDBContext = (): OfflineDBContextType => {
  const context = useContext(OfflineDBContext);
  if (!context) {
    throw new Error(
      'useOfflineDBContext must be used within an OfflineDBProvider'
    );
  }
  return context;
};

export default OfflineDBProvider;
