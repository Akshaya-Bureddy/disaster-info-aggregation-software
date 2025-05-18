import express from 'express';
import ExternalData from '../models/ExternalData.js';

const router = express.Router();

// Get all external disaster data
router.get('/', async (req, res) => {
  try {
    const data = await ExternalData.find()
      .sort({ timestamp: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 1000);
    res.json(data);
  } catch (error) {
    console.error('Error fetching external data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get disasters by type
router.get('/type/:disasterType', async (req, res) => {
  try {
    const data = await ExternalData.find({ type: req.params.disasterType })
      .sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent disasters
router.get('/recent', async (req, res) => {
  try {
    const data = await ExternalData.find()
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get disasters by severity
router.get('/severity/:level', async (req, res) => {
  try {
    const data = await ExternalData.find({ severity: req.params.level.toUpperCase() })
      .sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;