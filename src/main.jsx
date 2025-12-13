import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/styles.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx' // Import LanguageProvider
import { ThemeProvider } from './contexts/ThemeContext.jsx' // Import ThemeProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider> {/* Wrap App with LanguageProvider */}
          <ThemeProvider> {/* Wrap App with ThemeProvider */}
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
