import { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
import { Card } from '../../components/ui/Card'
import StatsCard from '../../components/ui/StatsCard'
import Button from '../../components/ui/Button'
import api from '../../utils/api'
import { formatDate } from '../../utils/utils'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v || 0) } catch { return `ETB ${Number(v||0).toLocaleString()}` }
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [leases, setLeases] = useState([]) // Add leases state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        if (user?.role === 'tenant') {
          // For tenants, fetch only their relevant data
          const [pays, lses] = await Promise.all([
            api.get('payments'), // This should be filtered to tenant's payments
            api.get('leases')    // This should be filtered to tenant's leases
          ])
          setPayments(pays || [])
          setLeases(lses || [])
        } else {
          // For managers/admins, fetch all data
          const [props, tens, pays, lses] = await Promise.all([
            api.get('properties'),
            api.get('tenants'),
            api.get('payments'),
            api.get('leases')
          ])
          setProperties(props || [])
          setTenants(tens || [])
          setPayments(pays || [])
          setLeases(lses || [])
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.')
        console.error('Dashboard data fetch error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const stats = useMemo(() => {
    const totalProperties = properties.length
    const totalTenants = tenants.length
    const monthlyRevenue = properties.reduce((sum, p) => sum + (p.rent || 0), 0)
    const outstanding = payments.reduce((sum, p) => sum + (p.status === 'Unpaid' ? p.amount : 0), 0)
    return { totalProperties, totalTenants, monthlyRevenue, outstanding }
  }, [properties, tenants, payments])

  const recentActivity = useMemo(() => {
    const sorted = [...tenants].sort((a,b)=> new Date(b.moveInDate) - new Date(a.moveInDate))
    return sorted.slice(0,3)
  }, [tenants])

  const expiringLeases = useMemo(() => {
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    return leases.filter(lease => {
        const endDate = new Date(lease.endDate);
        return endDate >= today && endDate <= sixtyDaysFromNow;
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
            <Button onClick={() => window.location.reload()}>{t('Retry')}</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>{t('Dashboard')}</h1>
        <p>{t('Welcome back, here\'s your rental overview.')}</p>
      </div>

      <div className="stats-grid">
        <Card className="data-card"><p>{t('Total Properties')}</p><h2>{stats.totalProperties}</h2></Card>
        <Card className="data-card"><p>{t('Active Tenants')}</p><h2>{stats.totalTenants}</h2></Card>
        <Card className="data-card"><p>{t('Monthly Revenue')}</p><h2 className="text-green">{fmtCurrency(stats.monthlyRevenue)}</h2></Card>
        <Card className="data-card"><p>{t('Outstanding Balance')}</p><h2 className="text-red">{fmtCurrency(stats.outstanding)}</h2></Card>
      </div>

      <div className="activity-grid">
        <Card className="activity-card">
          <h3 className="data-card-header">{t('Recent Activity')}</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>{t('Activity')}</th><th>{t('Tenant')}</th><th>{t('Date')}</th></tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr><td colSpan={3} className="text-center p-4">{t('No recent activity.')}</td></tr>
                ) : recentActivity.map(tenant => (
                  <tr key={tenant.id}>
                    <td>{t('New Tenant Added')}</td>
                    <td>{tenant.name}</td>
                    <td>{formatDate(tenant.moveInDate)}</td>
                  </tr>
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
                        const tenant = tenants.find(t => t.id === lease.tenantId);
                        const property = properties.find(p => p.id === lease.propertyId);
                        return (
                            <div key={lease.id} className="lease-expiration-item">
                                <div>
                                    <p>{tenant?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">{property?.name || 'N/A'}</p>
                                </div>
                                <span>{formatDate(lease.endDate)}</span>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-gray-500">{t('No leases are expiring in the next 60 days.')}</p>
                )}
            </div>
        </Card>
      </div>
    </div>
  )
}
