import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BudgetProvider } from './context/BudgetContext'
import { ExpenseProvider } from './context/ExpenseContext'
import { IncomeProvider } from './context/IncomeContext'
import { SavingsProvider } from './context/SavingsContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BudgetProvider>
            <ExpenseProvider>
              <IncomeProvider>
                <SavingsProvider>
                  <App />
                </SavingsProvider>
              </IncomeProvider>
            </ExpenseProvider>
          </BudgetProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
