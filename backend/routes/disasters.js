const express = require('express');
const router = express.Router();
const Disaster = require('../models/Disaster');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get reported disasters with filters and pagination
router.get('/reported', auth, async (req, res) => {
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

    const total = await Disaster.countDocuments(filter);

    res.json({
      disasters,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching reported disasters:', error);
    res.status(500).json({ message: 'Error fetching disaster reports' });
  }
});

// Add other existing disaster routes here

module.exports = router;
