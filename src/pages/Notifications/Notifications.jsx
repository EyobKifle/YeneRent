import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Notifications.css'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'
import { formatDate } from '../../utils/utils'
import { Bell, Calendar as CalendarIcon, MessageSquare, Clock, Plus, Trash2 } from 'lucide-react'
import AddNotificationModal from '../../components/Notifications/AddNotificationModal'
import Calendar from '../../components/Notifications/Calendar'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState('notifications') // 'notifications' or 'planner'
  const { showNotification, refreshUnreadCount } = useNotification()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const isAdmin = user?.role === 'admin' || user?.role === 'owner';
      
      const promises = [
        api.get('notifications'),
        api.get('notifications?all=true'),
        api.get(isAdmin ? 'user-requests' : 'user-requests/my')
      ];

      if (isAdmin) {
        promises.push(api.get('leases'));
        promises.push(api.get('tenants'));
        promises.push(api.get('properties'));
      }

      const results = await Promise.allSettled(promises);

      const getVal = (res) => res.status === 'fulfilled' ? res.value : null

      const activeNotifsVal = getVal(results[0])
      const allNotifsVal = getVal(results[1])
      const userRequestsVal = getVal(results[2])
      
      let leasesVal = null;
      let tenantsVal = null;
      let propertiesVal = null;

      if (isAdmin) {
        leasesVal = getVal(results[3]);
        tenantsVal = getVal(results[4]);
        propertiesVal = getVal(results[5]);
      }

      const processedNotifs = []
      const events = []

      // Process Admin Messages and User Reminders
      const allNotifsList = Array.isArray(allNotifsVal) ? allNotifsVal : (allNotifsVal?.data || [])
      allNotifsList.forEach(notif => {
        const event = {
          id: notif._id,
          type: notif.type === 'reminder' ? 'reminder' : 'admin',
          message: notif.title,
          date: notif.eventDate || notif.createdAt,
          fullData: notif
        }
        events.push(event)
      })

      // Process User Request Responses
      const userRequestsList = Array.isArray(userRequestsVal) ? userRequestsVal : (userRequestsVal?.data || [])
      userRequestsList.forEach(req => {
        if (req.adminResponse) {
          const date = req.respondedAt || req.updatedAt
          processedNotifs.push({
            id: `req-${req._id}`,
            type: 'admin-response',
            message: `Admin responded to your request: "${req.title}"`,
            date: date,
            priority: 'medium',
            read: false, 
            metadata: req
          })
          events.push({
            id: `req-${req._id}`,
            type: 'admin',
            message: `Admin Response: ${req.title}`,
            date: date
          })
        }
      })

      // Process Lease Expirations (Calculated)
      if (leasesVal && tenantsVal && propertiesVal) {
        const today = new Date()
        const sixtyDaysFromNow = new Date()
        sixtyDaysFromNow.setDate(today.getDate() + 60)

        const safeLeases = Array.isArray(leasesVal) ? leasesVal : (leasesVal?.data || [])
        const safeTenants = Array.isArray(tenantsVal) ? tenantsVal : (tenantsVal?.data || [])
        const safeProperties = Array.isArray(propertiesVal) ? propertiesVal : (propertiesVal?.data || [])

        safeLeases.forEach(lease => {
          const endDate = new Date(lease.endDate)
          if (endDate >= today && endDate <= sixtyDaysFromNow) {
            const tenant = safeTenants.find(t => t.id === lease.tenantId || t._id === lease.tenantId)
            const property = safeProperties.find(p => p.id === lease.propertyId || p._id === lease.propertyId)
            
            const leaseNotif = {
              id: `lease-${lease.id || lease._id}`,
              type: 'lease-expiration',
              message: `Lease for ${tenant?.name || 'Tenant'} at ${property?.name || 'Property'} expires on ${formatDate(lease.endDate)}`,
              date: lease.endDate,
              priority: 'high'
            }
            processedNotifs.push(leaseNotif)
            events.push({
              id: leaseNotif.id,
              type: 'lease',
              message: leaseNotif.message,
              date: lease.endDate
            })
          }
        })
      }

      // Add active notifications from API
      const activeNotifsList = Array.isArray(activeNotifsVal) ? activeNotifsVal : (activeNotifsVal?.data || [])
      activeNotifsList.forEach(notif => {
        processedNotifs.push({
          id: notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          date: notif.createdAt,
          priority: notif.type === 'admin' ? 'high' : 'medium',
          read: notif.read,
          metadata: notif
        })
      })

      // Sort and Set
      setNotifications(processedNotifs.sort((a, b) => new Date(b.date) - new Date(a.date)))
      setUpcomingEvents(events.sort((a, b) => new Date(a.date) - new Date(b.date)))
      
    } catch (err) {
      setError('Failed to load notifications. Please try again.')
      console.error('Notifications fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const markAsRead = async (id) => {
    try {
      await api.put(`notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      refreshUnreadCount()
    } catch (err) {
      showNotification('Failed to mark as read', 'error')
    }
  }

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to remove this notification?')) return
    try {
      await api.delete(`notifications/${id}`)
      showNotification('Notification removed', 'success')
      fetchData()
      refreshUnreadCount()
    } catch (err) {
      showNotification('Failed to remove notification', 'error')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return
    try {
      await api.delete('notifications')
      showNotification('All notifications cleared', 'success')
      fetchData()
      refreshUnreadCount()
    } catch (err) {
      showNotification('Failed to clear notifications', 'error')
    }
  }

  if (loading && notifications.length === 0) {
    return <div className="p-8 text-center">Loading notifications...</div>
  }
  return (
    <div className="notifications-page">
      <header className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Manage your alerts and custom reminders.</p>
        </div>
        <div className="header-actions">
          <div className="action-buttons">
            <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <Plus size={18} /> Add notification
            </Button>
            {notifications.length > 0 && (
              <Button 
                variant="danger" 
                onClick={handleClearAll}
                className="flex items-center gap-2"
              >
                <Trash2 size={18} /> Clear all
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="notifications-content">
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <h3>No notifications yet</h3>
              <p className="text-gray-500">We'll notify you when something important happens.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${notif.priority} ${notif.read ? 'read' : 'unread'}`}
                onClick={() => navigate(`/notifications/${notif.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex gap-4">
                  <div className={`event-icon ${notif.type}`}>
                    {notif.type === 'admin-message' || notif.type === 'admin' ? <MessageSquare size={20} /> : 
                     notif.type === 'lease-expiration' ? <Clock size={20} /> : <Bell size={20} />}
                  </div>
                  <div className="notification-content">
                    <p>{notif.title || notif.message}</p>
                    {notif.title && <span className="text-sm text-gray-500 block mt-1">{notif.message}</span>}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="notification-date">{formatDate(notif.date)}</span>
                      <span className="notification-type">{notif.type.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notif.read && (
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                    >
                      Mark Read
                    </Button>
                  )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notif.id);
                      }} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove notification"
                    >
                      <Trash2 size={18} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddNotificationModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdded={fetchData} 
      />
    </div>
  )
}

