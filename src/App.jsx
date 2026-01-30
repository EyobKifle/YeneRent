import { Routes, Route } from 'react-router-dom'

import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/Login/Login.jsx'
import DashboardPage from './pages/Dashboard/Dashboard.jsx'
import PropertiesPage from './pages/Properties/Properties.jsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx'
import AnalyticsPage from './pages/Analytics/Analytics.jsx'
import TenantsPage from './pages/Tenants/Tenants.jsx'
import UnitsPage from './pages/Units/Units.jsx'
import LeasesPage from './pages/Leases/Leases.jsx'
import DocumentsPage from './pages/Documents/Documents.jsx'
import DocumentDetails from './pages/Documents/DocumentDetails.jsx'
import PaymentsPage from './pages/Payments/Payments.jsx'
import MaintenancePage from './pages/Maintenance/Maintenance.jsx'
import MaintenanceDetails from './pages/Maintenance/MaintenanceDetails.jsx'
import NotificationsPage from './pages/Notifications/Notifications.jsx'
import PaymentDetails from './pages/Payments/PaymentDetails.jsx'
import ProfilePage from './pages/Profile/Profile.jsx'
import SettingsPage from './pages/Settings/Settings.jsx'
import SignupPage from './pages/Signup/Signup.jsx'
import UnitDetails from './pages/Units/UnitDetails.jsx'
import UtilitiesPage from './pages/Utilities/Utilities.jsx'
import UtilityDetails from './pages/Utilities/UtilityDetails.jsx'
import AdminPage from './pages/Admin/Admin.jsx'

// Import reusable components
import Layout from './components/layout/Layout.jsx'
import PublicLayout from './components/layout/PublicLayout.jsx'
import AuthLayout from './pages/Auth/AuthLayout.jsx'

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Authenticated Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/:id" element={<UnitDetails />} />
          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentDetails />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/:id" element={<PaymentDetails />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetails />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/utilities" element={<UtilitiesPage />} />
          <Route path="/utilities/:id" element={<UtilityDetails />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* A catch-all route for 404 Not Found pages */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
