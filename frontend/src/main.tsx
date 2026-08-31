import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found in DOM')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 5000,
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
