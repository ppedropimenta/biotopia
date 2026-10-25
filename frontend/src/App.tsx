import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './Layout'
import { CreditsPage } from './pages/CreditsPage'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="credits" element={<CreditsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
