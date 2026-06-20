import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/theme.css'
import './styles/global.css'
import App from './App.jsx'
import { seedDatabase } from './db/seed'

seedDatabase().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
