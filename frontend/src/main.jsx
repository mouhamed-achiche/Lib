import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import { AuthProvider } from './lib/auth'
import { CartProvider } from './lib/cart'
import { LocalStorageProvider } from './lib/LocalStorageProvider'
import { OfflineDBProvider } from './lib/OfflineDBProvider'
import { LanguageProvider } from './lib/language'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <OfflineDBProvider>
        <LocalStorageProvider>
          <LanguageProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <CartProvider>
                  <App />
                  <Toaster position="top-right" richColors />
                </CartProvider>
              </AuthProvider>
            </QueryClientProvider>
          </LanguageProvider>
        </LocalStorageProvider>
      </OfflineDBProvider>
    </BrowserRouter>
  </React.StrictMode>
)

