import { BrowserRouter, Route, Routes } from 'react-router'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SearchResultsPage } from './pages/SearchResultsPage'
import { ToiletDetailPage } from './pages/ToiletDetailPage'
import { UserReportPage } from './pages/UserReportPage'
import { MyReportsPage } from './pages/MyReportsPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import { AccountPage } from './pages/AccountPage'
import { AuthProvider } from './hooks/AuthContext'

export default function App() {
  return (
    <AuthProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<UserReportPage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/results" element={<SearchResultsPage />} />
        <Route path="/toilets/:id" element={<ToiletDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter></AuthProvider>
  )
}
