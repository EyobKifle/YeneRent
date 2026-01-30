import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'
import './Profile.css'

const UserRequestForm = ({ onRequestCreated }) => {
  const [formData, setFormData] = useState({
    type: 'support',
    title: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await api.post('user-requests', formData)
      setMessage('Request submitted successfully!')
      setFormData({ type: 'support', title: '', description: '' })
      if (onRequestCreated) onRequestCreated()
    } catch (error) {
      setMessage(error.message || 'Failed to submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-request-form">
      <h4>Submit a Request</h4>
      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="request-type">Request Type</label>
          <select
            id="request-type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="support">Support</option>
            <option value="feature_request">Feature Request</option>
            <option value="bug_report">Bug Report</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="request-title">Title</label>
          <input
            type="text"
            id="request-title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief title for your request"
            maxLength="200"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="request-description">Description</label>
          <textarea
            id="request-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description of your request"
            rows="4"
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatarUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMessage, setPwdMessage] = useState('')
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' })
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      })
    }
  }, [user])

  useEffect(() => {
    const fetchSubscription = async () => {
      setSubscriptionLoading(true)
      try {
        const subscriptionData = await api.getSubscription()
        setSubscription(subscriptionData)
      } catch (error) {
        console.error('Error fetching subscription:', error)
        // Subscription might not exist, which is fine
      } finally {
        setSubscriptionLoading(false)
      }
    }

    if (user) {
      fetchSubscription()
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.updateProfile({ name: formData.name, phone: formData.phone })
      setMessage('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      setMessage(e.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      avatarUrl: user.avatarUrl || ''
    })
    setIsEditing(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          avatarUrl: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="page-header">
          <h1>Profile</h1>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account information and preferences.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <Card className="profile-card">
        <div className="profile-header">
          <div className="avatar-section">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt="Profile Avatar"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar default-avatar">
                <span className="avatar-initial">
                  {formData.email ? formData.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            {isEditing && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button variant="secondary" size="small" as="span">
                    Change Avatar
                  </Button>
                </label>
              </div>
            )}
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <form className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
            />
          </div>
        </form>
      </Card>

      <Card className="subscription-card">
        <h3>Subscription</h3>
        {subscriptionLoading ? (
          <p>Loading subscription...</p>
        ) : subscription ? (
          <div className="subscription-info">
            <div className="subscription-detail">
              <span>Current Plan:</span>
              <span>{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</span>
            </div>
            <div className="subscription-detail">
              <span>Billing Cycle:</span>
              <span>{subscription.billingCycle}</span>
            </div>
            <div className="subscription-detail">
              <span>Status:</span>
              <span>{subscription.status}</span>
            </div>
            <div className="subscription-detail">
              <span>Next Billing:</span>
              <span>{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
            </div>
            <div className="profile-actions">
              <Button variant="secondary" onClick={() => window.location.href = '/subscription'}>
                Update Subscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="subscription-info">
            <p>No active subscription found.</p>
            <div className="profile-actions">
              <Button variant="primary" onClick={() => window.location.href = '/subscription'}>
                Choose Plan
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="password-card">
        <h3>Account Security</h3>
        {pwdMessage && (
          <div className={`message ${pwdMessage.includes('success') ? 'success' : 'error'}`}>
            {pwdMessage}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={pwdForm.currentPassword}
            onChange={(e) => setPwdForm(prev => ({ ...prev, currentPassword: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={pwdForm.newPassword}
            onChange={(e) => setPwdForm(prev => ({ ...prev, newPassword: e.target.value }))}
          />
        </div>
        <div className="profile-actions">
          <Button variant="secondary" onClick={async () => {
            setPwdLoading(true)
            setPwdMessage('')
            try {
              if (!pwdForm.currentPassword || !pwdForm.newPassword) {
                setPwdMessage('Please enter current and new password.')
              } else {
                await api.updateProfile({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
                setPwdMessage('Password updated successfully!')
                setPwdForm({ currentPassword: '', newPassword: '' })
              }
            } catch (e) {
              setPwdMessage(e.message || 'Failed to change password.')
            } finally {
              setPwdLoading(false)
            }
          }} disabled={pwdLoading}>
            {pwdLoading ? 'Updating...' : 'Change Password'}
          </Button>
          <Button variant="danger" onClick={logout}>
            Logout
          </Button>
        </div>
      </Card>

      <Card className="requests-card">
        <h3>Support & Requests</h3>
        <p>Need help or have suggestions? Submit a request and our team will get back to you.</p>
        <UserRequestForm />
      </Card>
    </div>
  )
}
