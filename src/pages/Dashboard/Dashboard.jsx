import { useCallback, useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
import { Card } from '../../components/ui/Card'
import StatsCard from '../../components/ui/StatsCard'
import Button from '../../components/ui/Button'
import api from '../../utils/api'
import { formatDate } from '../../utils/utils'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v || 0) } catch { return `ETB ${Number(v||0).toLocaleString()}` }
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [leases, setLeases] = useState([]) // Add leases state
  const [utilities, setUtilities] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (user?.role === 'tenant') {
        const [pays, lses, utils, maint, docs] = await Promise.all([
          api.get('payments'),
          api.get('leases'),
          api.get('utilities'),
          api.get('maintenance'),
          api.get('documents')
        ])
        setPayments(pays || [])
        setLeases(lses || [])
        setUtilities(utils || [])
        setMaintenance(maint || [])
        setDocuments(docs || [])
        setProperties([])
        setTenants([])
      } else {
        const [props, tens, pays, lses, utils, maint, docs] = await Promise.all([
          api.get('properties'),
          api.get('tenants'),
          api.get('payments'),
          api.get('leases'),
          api.get('utilities'),
          api.get('maintenance'),
          api.get('documents')
        ])
        setProperties(props.properties || [])
        setTenants(tens || [])
        setPayments(pays || [])
        setLeases(lses || [])
        setUtilities(utils || [])
        setMaintenance(maint || [])
        setDocuments(docs || [])
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('Dashboard data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData, user])

  const stats = useMemo(() => {
    if (user?.role === 'tenant') {
      // For tenants, show their own stats
      const totalLeases = leases.length
      const totalPayments = payments.length
      const paidAmount = payments.reduce((sum, p) => sum + (p.status === 'Paid' ? p.amount : 0), 0)
      const outstanding = payments.reduce((sum, p) => sum + (p.status === 'Unpaid' || p.status === 'Pending' ? p.amount : 0), 0)
      return { totalLeases, totalPayments, paidAmount, outstanding }
    } else {
      // For managers/admins, show overall stats
      const totalProperties = properties.length
      const totalTenants = tenants.length
      const monthlyRevenue = properties.reduce((sum, p) => sum + (p.rent || 0), 0)
      const outstanding = payments.reduce((sum, p) => sum + (p.status === 'Unpaid' || p.status === 'Pending' ? p.amount : 0), 0)
      return { totalProperties, totalTenants, monthlyRevenue, outstanding }
    }
  }, [properties, tenants, payments, leases, user])

  const recentActivity = useMemo(() => {
    const tenantActivities = tenants.map(tenant => ({
      ...tenant,
      activityType: 'tenant',
      activityDate: new Date(tenant.createdAt || tenant.moveInDate || Date.now()),
      displayName: tenant.name,
      activity: 'New Tenant Added'
    }))
    const propertyActivities = properties.map(property => ({
      ...property,
      activityType: 'property',
      activityDate: new Date(property.createdAt || Date.now()),
      displayName: property.name,
      activity: 'New Property Added'
    }))
    const leaseActivities = leases.map(lease => ({
      ...lease,
      activityType: 'lease',
      activityDate: new Date(lease.createdAt || Date.now()),
      displayName: tenants.find(t => t._id === (lease.tenantId?._id || lease.tenantId))?.name || 'Lease',
      activity: 'New Lease Created'
    }))
    const paymentActivities = payments.map(payment => ({
      ...payment,
      activityType: 'payment',
      activityDate: new Date(payment.createdAt || payment.date || Date.now()),
      displayName: tenants.find(t => t._id === (payment.tenantId?._id || payment.tenantId))?.name || 'Payment',
      activity: 'Payment Recorded'
    }))
    const maintenanceActivities = maintenance.map(m => ({
      ...m,
      activityType: 'maintenance',
      activityDate: new Date(m.createdAt || m.reportedDate || Date.now()),
      displayName: m.title || 'Maintenance',
      activity: 'Maintenance Request'
    }))
    const utilityActivities = utilities.map(u => ({
      ...u,
      activityType: 'utility',
      activityDate: new Date(u.createdAt || u.dueDate || Date.now()),
      displayName: u.type || 'Utility',
      activity: 'Utility Bill Added'
    }))
    const documentActivities = documents.map(d => ({
      ...d,
      activityType: 'document',
      activityDate: new Date(d.createdAt || d.uploadDate || Date.now()),
      displayName: d.name || 'Document',
      activity: 'Document Uploaded'
    }))

    const allActivities = [
      ...tenantActivities, 
      ...propertyActivities, 
      ...leaseActivities, 
      ...paymentActivities,
      ...maintenanceActivities,
      ...utilityActivities,
      ...documentActivities
    ]
    const sorted = allActivities.sort((a,b) => b.activityDate - a.activityDate)
    return sorted.slice(0, 10) // Show more activities
  }, [tenants, properties, leases, payments, maintenance, utilities, documents])

  const activityRows = useMemo(() => {
    return recentActivity.length === 0 ? [{ id: 'no-activity', type: 'empty' }] : recentActivity.map(tenant => ({ ...tenant, type: 'activity' }))
  }, [recentActivity])

  const expiringLeases = useMemo(() => {
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);

    return leases.filter(lease => {
        const endDate = new Date(lease.endDate);
        return endDate >= today && endDate <= fiveDaysFromNow;
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  }, [leases]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>{t('Dashboard')}</h1>
          <p>{t('Loading your rental overview...')}</p>
        </div>
        <div className="stats-grid">
          <Card className="data-card"><p>{t('Loading...')}</p></Card>
          <Card className="data-card"><p>{t('Loading...')}</p></Card>
          <Card className="data-card"><p>{t('Loading...')}</p></Card>
          <Card className="data-card"><p>{t('Loading...')}</p></Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>{t('Dashboard')}</h1>
          <p>{t('Welcome back, here\'s your rental overview.')}</p>
        </div>
        <div className="stats-grid">
          <Card className="data-card">
            <p className="text-red">{error}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Button onClick={() => { setRetryCount(0); loadDashboardData(); }}>{t('Retry')}</Button>
              {retryCount >= 2 && <Button onClick={() => window.location.reload()}>{t('Reload Page')}</Button>}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {!isOnline && (
        <div className="offline-banner">
          <i className="fa-solid fa-wifi-slash"></i>
          <span>You are currently offline. Some features may not be available.</span>
        </div>
      )}
      <div className="page-header">
        <h1>{t('Dashboard')}</h1>
        <p>{t('Welcome back, here\'s your rental overview.')}</p>
      </div>

      <div className="stats-grid">
        {user?.role === 'tenant' ? (
          <>
            <Card key="tenant-leases" className="data-card"><p>{t('My Leases')}</p><h2>{stats.totalLeases}</h2></Card>
            <Card key="tenant-payments" className="data-card"><p>{t('My Payments')}</p><h2>{stats.totalPayments}</h2></Card>
            <Card key="tenant-paid" className="data-card"><p>{t('Total Paid')}</p><h2 className="text-green">{fmtCurrency(stats.paidAmount)}</h2></Card>
            <Card key="tenant-outstanding" className="data-card"><p>{t('Outstanding Balance')}</p><h2 className="text-red">{fmtCurrency(stats.outstanding)}</h2></Card>
          </>
        ) : (
          <>
            <Card key="admin-properties" className="data-card"><p>{t('Total Properties')}</p><h2>{stats.totalProperties}</h2></Card>
            <Card key="admin-tenants" className="data-card"><p>{t('Active Tenants')}</p><h2>{stats.totalTenants}</h2></Card>
            <Card key="admin-revenue" className="data-card"><p>{t('Monthly Revenue')}</p><h2 className="text-green">{fmtCurrency(stats.monthlyRevenue)}</h2></Card>
            <Card key="admin-outstanding" className="data-card"><p>{t('Outstanding Balance')}</p><h2 className="text-red">{fmtCurrency(stats.outstanding)}</h2></Card>
          </>
        )}
      </div>

      <div className="activity-grid">
        <Card className="activity-card">
          <h3 className="data-card-header">{t('Recent Activity')}</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>{t('Activity')}</th><th>{t('Related To')}</th><th>{t('Date')}</th></tr>
              </thead>
              <tbody>
                {activityRows.map((row, index) => (
                  row.type === 'empty' ? (
                    <tr key="no-activity"><td colSpan={3} className="text-center p-4">{t('No recent activity.')}</td></tr>
                  ) : (
                    <tr key={row._id || `activity-${index}`}>
                      <td>{row.activity}</td>
                      <td>{row.displayName}</td>
                      <td>{formatDate(row.activityDate)}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="quick-actions-card">
          <h3>{t('Quick Actions')}</h3>
          <div className="quick-actions">
            <a href="/properties#add" className="action-link"><i className="fa-solid fa-plus"></i><span>{t('Add Property')}</span></a>
            <a href="/tenants#add" className="action-link"><i className="fa-solid fa-user-plus"></i><span>{t('Add Tenant')}</span></a>
            <a href="/payments#record" className="action-link"><i className="fa-solid fa-money-bill-wave"></i><span>{t('Record Payment')}</span></a>
          </div>
        </Card>

        <Card className="quick-actions-card"> {/* Reusing quick-actions-card for styling */}
            <h3>{t('Upcoming Lease Expirations')}</h3>
            <div className="lease-expirations">
                {expiringLeases.length > 0 ? (
                    expiringLeases.map(lease => {
                        const tenant = tenants.find(t => t._id === lease.tenantId);
                        const property = properties.find(p => p._id === lease.propertyId);
                        return (
                            <div key={lease._id} className="lease-expiration-item">
                                <div>
                                    <p>{tenant?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">{property?.name || 'N/A'}</p>
                                </div>
                                <span>{formatDate(lease.endDate)}</span>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-gray-500">{t('No leases are expiring in the next 5 days.')}</p>
                )}
            </div>
        </Card>
      </div>
    </div>
  )
}
