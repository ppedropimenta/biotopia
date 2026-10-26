import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './Layout'
import { ConfirmPage } from './pages/ConfirmPage'
import { CreditsPage } from './pages/CreditsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { HomePage } from './pages/HomePage'
import { LogInPage } from './pages/LogInPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignUpPage } from './pages/SignUpPage'
import { TankFormPage } from './pages/TankFormPage'
import { TankPage } from './pages/TankPage'
import { TanksPage } from './pages/TanksPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="credits" element={<CreditsPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route path="login" element={<LogInPage />} />
            <Route path="confirm" element={<ConfirmPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route element={<RequireAuth />}>
              <Route path="tanks" element={<TanksPage />} />
              <Route path="tanks/new" element={<TankFormPage />} />
              <Route path="tanks/:id" element={<TankPage />} />
              <Route path="tanks/:id/edit" element={<TankFormPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
