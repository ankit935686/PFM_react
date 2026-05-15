import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import BudgetPage from './pages/BudgetPage'
import SavingsPage from './pages/SavingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/goals" element={<Navigate to="/savings" replace />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/income" element={<Navigate to="/transactions" replace />} />
        <Route path="/expenses" element={<Navigate to="/transactions" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
