import express from 'express';
import { body, validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// All routes require auth
router.use(authenticateToken);

// GET /api/notifications - List current user's notifications (including active reminders)
router.get('/', async (req, res) => {
  try {
    const { read, all } = req.query; // 'true' | 'false' | undefined, all='true' for planner
    const filter = { toUser: req.user.userId };
    
    if (read === 'true') filter.read = true;
    if (read === 'false') filter.read = false;

    // Logic for reminders: only show if eventDate is within 24 hours or in the past
    // UNLESS all=true is requested (for planner/upcoming)
    if (all !== 'true') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filter.$or = [
        { isReminder: { $ne: true } },
        { isReminder: true, eventDate: { $lte: tomorrow } }
      ];
    }

    const notifications = await Notification.find(filter)
      .populate('fromUser', 'name email role')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread/count - Get unread count for current user
router.get('/unread/count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ toUser: req.user.userId, read: false });
    res.json({ count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

// GET /api/notifications/:id - Get a specific notification
router.get('/:id', async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, toUser: req.user.userId })
      .populate('fromUser', 'name email role');
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// PUT /api/notifications/:id/read - Mark a specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, toUser: req.user.userId });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    await notif.markAsRead();
    res.json(notif);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/:id/unread - Mark a specific notification as unread
router.put('/:id/unread', async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, toUser: req.user.userId });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    notif.read = false;
    notif.readAt = null;
    await notif.save();
    res.json(notif);
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read for current user
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ toUser: req.user.userId, read: false }, { $set: { read: true, readAt: new Date() } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Admin-only: POST /api/notifications/send - Send a notification to a specific user
router.post('/send', authorizeRoles('owner','admin','property_manager'), [
  body('toUser').isString().trim().notEmpty().withMessage('toUser is required'),
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('title is required'),
  body('message').isString().trim().isLength({ min: 1 }).withMessage('message is required'),
  body('type').optional().isIn(['system','message','alert','reminder','admin']).withMessage('Invalid type'),
  body('metadata').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toUser, title, message, type = 'message', metadata = null } = req.body;

    // Validate recipient exists
    const user = await User.findById(toUser).select('_id');
    if (!user) return res.status(404).json({ error: 'Recipient user not found' });

    const notif = await Notification.create({
      toUser,
      fromUser: req.user.userId,
      title,
      message,
      type,
      metadata,
    });

    const populated = await notif.populate('fromUser', 'name email role');

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.userId,
        action: 'user_messaged',
        target: toUser,
        details: { title, targetEmail: user.email }
      });
    } catch (auditError) {
      console.error('Error logging user messaging:', auditError);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/notifications/reminders - Create a personal reminder
router.post('/reminders', [
  body('title').isString().trim().notEmpty().withMessage('title is required'),
  body('message').isString().trim().notEmpty().withMessage('reason is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, eventDate } = req.body;

    const reminder = await Notification.create({
      toUser: req.user.userId, // Corrected from req.user.id
      fromUser: req.user.userId, // Self-sent
      title,
      message,
      type: 'reminder',
      isReminder: true,
      eventDate: new Date(eventDate),
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// DELETE /api/notifications - Delete all notifications for current user
router.delete('/', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ toUser: req.user.userId });
    res.json({ message: 'All notifications deleted', count: result.deletedCount });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// DELETE /api/notifications/:id - Delete a notification (only if it belongs to user)
router.delete('/:id', async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, toUser: req.user.userId });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
