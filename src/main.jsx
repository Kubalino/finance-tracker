import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/theme.css'
import './styles/global.css'
import App from './App.jsx'
import { seedDatabase } from './db/seed'
import { ToastProvider } from './hooks/ToastProvider'
import ErrorBoundary from './components/shared/ErrorBoundary'

seedDatabase().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
})
