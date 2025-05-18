import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ExternalData from '../models/ExternalData.js';
import Disaster from '../models/Disaster.js';
import fs from 'fs';
import {
  createDisaster,
  getDisasters,
  getNearbyDisasters,
  updateDisasterStatus,
  getUserDisasters,
  deleteDisaster  // Add this import
} from '../controllers/disasterController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'videos') {
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Only video files are allowed'));
      }
    }
    if (file.fieldname === 'images') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
    }
    cb(null, true);
  }
});

router.route('/')
  .post(protect, upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 2 }
  ]), createDisaster)
  .get(protect, getDisasters);

router.get('/nearby', protect, getNearbyDisasters);
router.put('/:id', protect, admin, updateDisasterStatus);
router.delete('/:id', protect, deleteDisaster);

router.get('/reported', protect, async (req, res) => {
  try {
    const { type, severity, startDate, endDate, location, sort = '-timestamp', page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const disasters = await Disaster.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const transformedDisasters = disasters.map(disaster => {
      const disasterObj = disaster.toObject();
      if (disasterObj.images) {
        disasterObj.images = disasterObj.images.map(image => 
          image.startsWith('http') ? image : `/uploads/${image}`
        );
      }
      if (disasterObj.videos) {
        disasterObj.videos = disasterObj.videos.map(video => 
          video.startsWith('http') ? video : `/uploads/${video}`
        );
      }
      return disasterObj;
    });

    const total = await Disaster.countDocuments(filter);

    res.json({
      disasters: transformedDisasters,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching reported disasters:', error);
    res.status(500).json({ message: 'Error fetching disaster reports' });
  }
});

router.get('/external', async (req, res) => {
  try {
    const disasters = await ExternalData.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    if (!disasters || disasters.length === 0) {
      return res.status(404).json({ message: 'No disaster data found' });
    }
    
    res.json(disasters);
  } catch (error) {
    console.error('Error fetching external disasters:', error);
    res.status(500).json({ message: error.message });
  }
});


// Fix the route to use 'protect' instead of 'auth'
router.get('/user', protect, getUserDisasters);

// Add these new routes for analytics
router.get('/types', async (req, res) => {
  try {
    const types = await ExternalData.distinct('type');
    console.log('Available disaster types:', types);
    res.json(types);
  } catch (error) {
    console.error('Error fetching disaster types:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    // Get all disasters with proper type filtering
    const allDisasters = await ExternalData.find({
      type: { 
        $in: [
          'earthquake', 
          'tornado', 
          'cyclone', 
          'flood', 
          'severe_storm', 
          'volcano', 
          'drought', 
          'wildfire'
        ]
      }
    }).sort({ timestamp: -1 });

    // Log the distribution
    const distribution = allDisasters.reduce((acc, disaster) => {
      acc[disaster.type] = (acc[disaster.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Disaster Distribution:', distribution);

    res.json(allDisasters);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Keep existing routes
export default router;