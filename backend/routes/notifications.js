import express from 'express';
import { body, validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// All routes require auth
router.use(authenticateToken);

// GET /api/notifications - List current user's notifications (optionally filter by read)
router.get('/', async (req, res) => {
  try {
    const { read } = req.query; // 'true' | 'false' | undefined
    const filter = { toUser: req.user.userId };
    if (read === 'true') filter.read = true;
    if (read === 'false') filter.read = false;

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
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
