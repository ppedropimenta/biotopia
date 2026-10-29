import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthLayout } from './auth/AuthLayout'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './Layout'
import { AccountPage } from './pages/AccountPage'
import { ConfirmPage } from './pages/ConfirmPage'
import { CreditsPage } from './pages/CreditsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { HomePage } from './pages/HomePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { MaintenanceFormPage } from './pages/MaintenanceFormPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { PhotoFormPage } from './pages/PhotoFormPage'
import { PhotosPage } from './pages/PhotosPage'
import { MeasurementEditPage } from './pages/MeasurementEditPage'
import { MeasurementFormPage } from './pages/MeasurementFormPage'
import { SignInPage } from './pages/SignInPage'
import { TankFormPage } from './pages/TankFormPage'
import { TankPage } from './pages/TankPage'
import { TanksPage } from './pages/TanksPage'
import { TimelinePage } from './pages/TimelinePage'

// The component showcase exists only in development builds: in a production build this is null and the
// import below is dropped with it.
const KitPage = import.meta.env.DEV ? lazy(() => import('./dev/KitPage')) : null

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {KitPage && <Route path="dev/kit" element={
                <Suspense>
                  <KitPage />
                </Suspense>
              } />}
          <Route element={<AuthLayout />}>
            <Route path="signup" element={<SignInPage key="signup" mode="signup" />} />
            <Route path="login" element={<SignInPage key="login" mode="login" />} />
            <Route path="confirm" element={<ConfirmPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="credits" element={<CreditsPage />} />
            <Route element={<RequireAuth />}>
              <Route path="account" element={<AccountPage />} />
              <Route path="tanks" element={<TanksPage />} />
              <Route path="tanks/new" element={<TankFormPage />} />
              <Route path="tanks/:id" element={<TankPage />} />
              <Route path="tanks/:id/edit" element={<TankFormPage />} />
              <Route path="tanks/:id/timeline" element={<TimelinePage />} />
              <Route path="tanks/:id/maintenance" element={<MaintenancePage />} />
              <Route path="tanks/:id/maintenance/new" element={<MaintenanceFormPage mode="new" />} />
              <Route path="tanks/:id/maintenance/:maintenanceId/edit" element={<MaintenanceFormPage mode="edit" />} />
              <Route path="tanks/:id/photos" element={<PhotosPage />} />
              <Route path="tanks/:id/photos/new" element={<PhotoFormPage mode="new" />} />
              <Route path="tanks/:id/photos/:photoId/edit" element={<PhotoFormPage mode="edit" />} />
              <Route path="tanks/:id/measure" element={<MeasurementFormPage />} />
              <Route path="tanks/:id/measurements/:measurementId/edit" element={<MeasurementEditPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
