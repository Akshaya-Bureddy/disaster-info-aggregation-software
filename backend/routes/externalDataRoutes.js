import express from 'express';
import mongoose from 'mongoose';
import ExternalData from '../models/ExternalData.js';

const router = express.Router();

// Add the range endpoint
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const data = await ExternalData.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ timestamp: -1 });

    res.json(data);
  } catch (error) {
    console.error('Error fetching data range:', error);
    res.status(500).json({ message: 'Error fetching disaster data' });
  }
});

router.get('/', async (req, res) => {
  try {
    const disasters = await mongoose.connection.db
      .collection('externaldatas')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)  // Adjust limit as needed
      .toArray();

    if (!disasters || disasters.length === 0) {
      return res.status(404).json({ message: 'No disaster data found' });
    }

    res.json(disasters);
  } catch (error) {
    console.error('Error fetching global disasters:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await mongoose.connection.db
      .collection('externaldatas')
      .aggregate([
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalDisasters: { $sum: 1 },
                  byType: { $push: '$type' },
                  bySeverity: { $push: '$severity' },
                  bySource: { $push: '$source' }
                }
              }
            ],
            timeline: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { "_id": -1 } }
            ],
            floodStats: [
              { $match: { type: "flood" } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  avgWaterLevel: { $avg: "$floodData.waterLevel" },
                  avgRainfall: { $avg: "$floodData.rainfall" },
                  affectedAreas: { $addToSet: "$floodData.affectedArea" }
                }
              }
            ],
            cycloneStats: [
              { $match: { type: "cyclone" } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  avgWindSpeed: { $avg: "$cycloneData.windSpeed" },
                  avgPressure: { $avg: "$cycloneData.pressure" }
                }
              }
            ]
          }
        }
      ]).toArray();

    const processedStats = stats[0];
    const overview = processedStats.overview[0] || { totalDisasters: 0, byType: [], bySeverity: [], bySource: [] };

    const typeCount = {};
    const severityCount = {};
    const sourceCount = {};

    overview.byType.forEach(type => typeCount[type] = (typeCount[type] || 0) + 1);
    overview.bySeverity.forEach(sev => severityCount[sev] = (severityCount[sev] || 0) + 1);
    overview.bySource.forEach(src => sourceCount[src] = (sourceCount[src] || 0) + 1);

    res.json({
      total: overview.totalDisasters,
      byType: typeCount,
      bySeverity: severityCount,
      bySource: sourceCount,
      timeline: processedStats.timeline,
      floodStats: processedStats.floodStats[0] || { count: 0 },
      cycloneStats: processedStats.cycloneStats[0] || { count: 0 }
    });
  } catch (error) {
    console.error('Error fetching disaster statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/global', async (req, res) => {
  try {
    // Fetch all disasters for global map
    const allDisasters = await mongoose.connection.db
      .collection('externaldatas')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    if (!allDisasters || allDisasters.length === 0) {
      return res.status(404).json({ message: 'No disaster data found' });
    }

    // Filter Indian disasters for alerts and notifications
    const indianDisasters = allDisasters.filter(disaster => 
      disaster.location?.address?.includes('India') ||
      (disaster.location?.coordinates?.length === 2 &&
        disaster.location.coordinates[1] >= 6 && 
        disaster.location.coordinates[1] <= 37 &&
        disaster.location.coordinates[0] >= 68 && 
        disaster.location.coordinates[0] <= 97)
    );

    // Structure the response
    const response = {
      globalDisasters: allDisasters,
      indianDisasters: indianDisasters,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching global disasters:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;