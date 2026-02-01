import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const MessageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotification = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`notifications/${id}`);
      setNotification(response);
    } catch (err) {
      setError('Failed to load notification details');
      console.error('Error fetching notification:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNotification();
  }, [id, fetchNotification]);

  const markAsRead = async () => {
    if (notification && !notification.read) {
      try {
        await api.put(`notifications/${id}/read`);
        setNotification({ ...notification, read: true, readAt: new Date() });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      system: 'info',
      message: 'primary',
      alert: 'warning',
      reminder: 'secondary',
      admin: 'danger'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <div className="message-details-page">
        <div className="loading">Loading notification details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="message-details-page">
        <div className="error">{error}</div>
        <Button onClick={() => navigate('/notifications')}>Back to Notifications</Button>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="message-details-page">
        <div className="not-found">Notification not found</div>
        <Button onClick={() => navigate('/notifications')}>Back to Notifications</Button>
      </div>
    );
  }

  return (
    <div className="message-details-page">
      <PageHeader
        title="Message Details"
        subtitle={`From ${notification.fromUser?.name || 'System'}`}
        backLink="/notifications"
      />

      <div className="message-content">
        <div className="message-header">
          <div className="message-meta">
            <Badge variant={getTypeColor(notification.type)}>
              {notification.type}
            </Badge>
            <span className="message-date">
              {new Date(notification.createdAt).toLocaleString()}
            </span>
            {notification.read && (
              <span className="read-status">Read</span>
            )}
          </div>
          <h2 className="message-title">{notification.title}</h2>
        </div>

        <div className="message-body">
          <p>{notification.message}</p>
        </div>

        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
          <div className="message-metadata">
            <h3>Additional Information</h3>
            <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
          </div>
        )}

        <div className="message-actions">
          {!notification.read && (
            <Button onClick={markAsRead} variant="primary">
              Mark as Read
            </Button>
          )}
          <Button onClick={() => navigate('/notifications')} variant="secondary">
            Back to Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageDetails;
