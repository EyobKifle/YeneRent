import { useEffect, useState } from 'react'
import './Notifications.css'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'
import { formatDate } from '../../utils/utils'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const [leases, payments, maintenance, tenants, properties] = await Promise.all([
          api.get('leases'),
          api.get('payments'),
          api.get('maintenance'),
          api.get('tenants'),
          api.get('properties')
        ])

        const notifs = []

        // Lease expirations
        const today = new Date()
        const sixtyDaysFromNow = new Date()
        sixtyDaysFromNow.setDate(today.getDate() + 60)

        leases.forEach(lease => {
          const endDate = new Date(lease.endDate)
          if (endDate >= today && endDate <= sixtyDaysFromNow) {
            const tenant = tenants.find(t => t.id === lease.tenantId)
            const property = properties.find(p => p.id === lease.propertyId)
            notifs.push({
              id: `lease-${lease.id}`,
              type: 'lease-expiration',
              message: `Lease for ${tenant?.name || 'Tenant'} at ${property?.name || 'Property'} expires on ${formatDate(lease.endDate)}`,
              date: lease.endDate,
              priority: 'high'
            })
          }
        })

        // Overdue payments
        payments.forEach(payment => {
          if (payment.status === 'Unpaid' && new Date(payment.dueDate) < today) {
            notifs.push({
              id: `payment-${payment.id}`,
              type: 'overdue-payment',
              message: `Payment of ${payment.amount} ETB is overdue`,
              date: payment.dueDate,
              priority: 'high'
            })
          }
        })

        // Maintenance issues
        maintenance.forEach(maint => {
          if (maint.status === 'In Progress') {
            const property = properties.find(p => p.id === maint.propertyId)
            notifs.push({
              id: `maint-${maint.id}`,
              type: 'maintenance',
              message: `${maint.title} at ${property?.name || 'Property'} is in progress`,
              date: maint.reportedDate,
              priority: 'medium'
            })
          }
        })

        setNotifications(notifs.sort((a, b) => new Date(b.date) - new Date(a.date)))
      } catch (err) {
        setError('Failed to load notifications. Please try again.')
        console.error('Notifications fetch error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="page-header">
          <h1>Notifications</h1>
          <p>Loading notifications...</p>
        </div>
        <Card>
          <p>Loading...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="notifications-page">
        <div className="page-header">
          <h1>Notifications</h1>
          <p>Stay updated with important alerts and reminders.</p>
        </div>
        <Card>
          <p className="text-red">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Stay updated with important alerts and reminders.</p>
      </div>

      <Card>
        {notifications.length === 0 ? (
          <p>No notifications at this time.</p>
        ) : (
          <div className="notifications-list">
            {notifications.map(notif => (
              <div key={notif.id} className={`notification-item ${notif.priority}`}>
                <div className="notification-content">
                  <p>{notif.message}</p>
                  <span className="notification-date">{formatDate(notif.date)}</span>
                </div>
                <Button variant="secondary" size="small">View</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
