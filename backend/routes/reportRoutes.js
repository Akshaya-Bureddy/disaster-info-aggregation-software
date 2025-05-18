import express from 'express';
import {
  createReport,
  getReports,
  getAnalytics,
  getRescueTeams
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, getReports);
router.get('/analytics', protect, getAnalytics);
router.get('/rescue-teams', protect, getRescueTeams);

export default router;