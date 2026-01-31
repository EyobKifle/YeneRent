import express from 'express';
import UserRequest from '../models/UserRequest.js';
import User from '../models/User.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all user requests (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const requests = await UserRequest.find()
      .populate('user', 'name email')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's own requests
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const requests = await UserRequest.find({ user: req.user.id })
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, description } = req.body;
    const request = new UserRequest({
      user: req.user.id,
      type,
      title,
      description
    });
    const savedRequest = await request.save();
    await savedRequest.populate('user', 'name email');
    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update request status (admin only)
router.patch('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const request = await UserRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const oldStatus = request.status;
    request.status = status;
    if (adminResponse) {
      request.adminResponse = adminResponse;
      request.respondedBy = req.user.id;
      request.respondedAt = new Date();
    }

    const updatedRequest = await request.save();
    await updatedRequest.populate('user', 'name email');
    await updatedRequest.populate('respondedBy', 'name');

    // Send notification to user if status changed
    if (oldStatus !== status && (status === 'approved' || status === 'rejected')) {
      const notificationTitle = status === 'approved' ? 'Request Approved' : 'Request Rejected';
      const notificationMessage = status === 'approved'
        ? `Your request "${request.title}" has been approved.`
        : `Your request "${request.title}" has been rejected.`;

      const notification = new Notification({
        toUser: request.user,
        fromUser: req.user.id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'admin',
        metadata: { requestId: request._id }
      });
      await notification.save();
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a request (user can delete their own, admin can delete any)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await UserRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is admin or the owner of the request
    if (req.user.role !== 'admin' && request.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await request.deleteOne();
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
