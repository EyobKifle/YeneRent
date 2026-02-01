import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../utils/api';

export default function AddNotificationModal({ isOpen, onClose, onAdded }) {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    eventDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.eventDate) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('notifications/reminders', formData);
      showNotification('Reminder added successfully', 'success');
      onAdded();
      onClose();
      setFormData({ title: '', message: '', eventDate: '' });
    } catch (error) {
      console.error('Error adding reminder:', error);
      showNotification('Failed to add reminder', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Notification">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            placeholder="e.g., Tax Payment Day"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Reason / Description</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="Describe the reason for this notification"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            style={{ resize: 'vertical', minHeight: '80px' }}
          ></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Target Date</label>
          <input
            className="form-input"
            type="date"
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            required
          />
        </div>
        <p className="text-sm text-gray-500 italic">
          You will be notified 24 hours before this date.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Notification'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
