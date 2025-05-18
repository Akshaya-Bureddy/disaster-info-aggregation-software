import ExternalData from '../models/ExternalData.js';

// Get all external data with pagination and filtering
export const getExternalData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Fetch data from multiple sources
    const [earthquakeData, weatherData] = await Promise.all([
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson').then(r => r.json()),
      // Add more external API calls here
    ]);

    // Process and combine the data
    const combinedData = [
      ...processEarthquakeData(earthquakeData),
      // Add more data processing
    ];

    res.json(combinedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get nearby external data
export const getNearbyData = async (req, res) => {
  try {
    const { 
      longitude, 
      latitude, 
      maxDistance = 10000,
      type,
      severity,
      limit = 50
    } = req.query;

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    };

    if (type) query.type = type;
    if (severity) query.severity = severity;

    const data = await ExternalData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Get statistics for nearby events
    const stats = await ExternalData.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgDistance: { $avg: '$distance' },
          mostRecent: { $max: '$timestamp' }
        }
      }
    ]);

    res.json({
      data,
      stats,
      query: {
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        maxDistance: parseInt(maxDistance)
      }
    });
  } catch (error) {
    console.error('Error in getNearbyData:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default {
  getExternalData,
  getNearbyData
};