import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// All subscription routes require authentication
router.use(authenticateToken);

// GET /api/subscriptions/current - Get current user's subscription
router.get('/current', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.userId }).sort({ createdAt: -1 });
    // Return null if no subscription found, instead of 404 to avoid console errors in frontend
    res.json(subscription || null);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

export default router;
