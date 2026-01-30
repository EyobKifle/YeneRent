import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'
import './Profile.css'

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
    </div>
  )
}
