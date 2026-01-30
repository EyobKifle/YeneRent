import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/Login/Login.jsx'
import DashboardPage from './pages/Dashboard/Dashboard.jsx'
import PropertiesPage from './pages/Properties/Properties.jsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx'
import AnalyticsPage from './pages/Analytics/Analytics.jsx'
import TenantsPage from './pages/Tenants/Tenants.jsx'
import TenantDetails from './pages/Tenants/TenantDetails.jsx'
import TenantEdit from './pages/Tenants/TenantEdit.jsx'
import UnitsPage from './pages/Units/Units.jsx'
import LeasesPage from './pages/Leases/Leases.jsx'
import LeaseDetails from './pages/Leases/LeaseDetails.jsx'
import LeaseEdit from './pages/Leases/LeaseEdit.jsx'
import DocumentsPage from './pages/Documents/Documents.jsx'
import DocumentDetails from './pages/Documents/DocumentDetails.jsx'
import DocumentEdit from './pages/Documents/DocumentEdit.jsx'
import PaymentsPage from './pages/Payments/Payments.jsx'
import MaintenancePage from './pages/Maintenance/Maintenance.jsx'
import MaintenanceDetails from './pages/Maintenance/MaintenanceDetails.jsx'
import MaintenanceEdit from './pages/Maintenance/MaintenanceEdit.jsx'
import NotificationsPage from './pages/Notifications/Notifications.jsx'
import MessageDetails from './pages/Notifications/MessageDetails.jsx'
import PaymentDetails from './pages/Payments/PaymentDetails.jsx'
import ProfilePage from './pages/Profile/Profile.jsx'
import SettingsPage from './pages/Settings/Settings.jsx'
import SignupPage from './pages/Signup/Signup.jsx'
import UnitDetails from './pages/Units/UnitDetails.jsx'
import UtilitiesPage from './pages/Utilities/Utilities.jsx'
import UtilityDetails from './pages/Utilities/UtilityDetails.jsx'
import AdminPage from './pages/Admin/Admin.jsx'
import SetupPage from './pages/Setup/Setup.jsx'

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
          <Route path="/tenants/:id" element={<TenantDetails />} />
          <Route path="/tenants/:id/edit" element={<TenantEdit />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/units/:id" element={<UnitDetails />} />
          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/leases/:id" element={<LeaseDetails />} />
          <Route path="/leases/:id/edit" element={<LeaseEdit />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentDetails />} />
          <Route path="/documents/:documentId/edit" element={<DocumentEdit />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/:id" element={<PaymentDetails />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetails />} />
          <Route path="/maintenance/:id/edit" element={<MaintenanceEdit />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/:id" element={<MessageDetails />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/utilities" element={<UtilitiesPage />} />
          <Route path="/utilities/:id" element={<UtilityDetails />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/setup" element={<SetupPage />} />
        </Route>

        {/* A catch-all route for 404 Not Found pages */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
