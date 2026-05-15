import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ExpenseProvider } from './context/ExpenseContext'
import { IncomeProvider } from './context/IncomeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ExpenseProvider>
          <IncomeProvider>
            <App />
          </IncomeProvider>
        </ExpenseProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
