import mongoose from 'mongoose';

const externalDataSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['weather', 'news', 'usgs', 'nasa', 'noaa', 'gdacs', 'emdat']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'earthquake',
      'tornado',
      'cyclone',
      'hurricane',
      'typhoon',
      'flood',
      'flash_flood',
      'coastal_flood',
      'severe_storm',
      'thunderstorm',
      'winter_storm',
      'volcano',
      'volcanic_eruption',
      'drought',
      'extreme_heat',
      'wildfire',
      'landslide',
      'avalanche',
      'tsunami',
      'extreme_weather'
    ]
  },
  title: String,
  content: String,
  sourceUrl: String,
  imageUrl: String,
  location: {
    type: { type: String },
    coordinates: [Number],
    address: String
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],  // Added CRITICAL level
    required: true
  },
  description: String,
  temperature: Number,
  humidity: Number,
  windSpeed: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {  // Added last updated timestamp
    type: Date,
    default: Date.now
  },
  // Fix the schema structure for floodData and cycloneData
  floodData: {
    type: {
      waterLevel: Number,
      rainfall: Number,
      affectedArea: String,
      evacuationStatus: String,
      riverLevel: Number,
      floodType: String
    },
    default: null
  },
  cycloneData: {
    type: {
      category: Number,
      windSpeed: Number,
      pressure: Number,
      stormSurge: Number,
      predictedPath: [[Number]],
      intensityTrend: String
    },
    default: null
  },
  // Additional specific data fields for different disaster types
  earthquakeData: {
    type: {
      magnitude: Number,
      depth: Number,
      tsunamiPotential: Boolean,
      aftershocks: [{ magnitude: Number, timestamp: Date }]
    },
    default: null
  },
  tornadoData: {
    type: {
      category: String, // EF0 to EF5
      pathLength: Number,
      pathWidth: Number,
      windSpeed: Number
    },
    default: null
  },
  cycloneData: {
    type: {
      category: Number,
      windSpeed: Number,
      pressure: Number,
      stormSurge: Number,
      predictedPath: [[Number]],
      intensityTrend: String
    },
    default: null
  },
  floodData: {
    type: {
      waterLevel: Number,
      rainfall: Number,
      affectedArea: String,
      evacuationStatus: String,
      riverLevel: Number,
      floodType: String
    },
    default: null
  },
  volcanoData: {
    type: {
      alertLevel: String,
      ashCloudHeight: Number,
      explosivityIndex: Number,
      lavaFlow: Boolean,
      gasEmissions: [String]
    },
    default: null
  },
  droughtData: {
    type: {
      severity: String,
      duration: Number,
      precipitation: Number,
      soilMoisture: Number,
      impactedCrops: [String]
    },
    default: null
  }
});

// Enhanced pre-save middleware
externalDataSchema.pre('save', function(next) {
  // Normalize disaster types
  const normalizations = {
    'wildfires': 'wildfire',
    'severe_storms': 'severe_storm',
    'storms': 'severe_storm',
    'severe storms': 'severe_storm',
    'floods': 'flood',
    'hurricanes': 'hurricane',
    'volcanic eruption': 'volcanic_eruption',
    'typhoons': 'typhoon'
  };

  if (normalizations[this.type]) {
    this.type = normalizations[this.type];
  }

  this.lastUpdated = new Date();
  next();
});

externalDataSchema.index({ location: '2dsphere' });
externalDataSchema.index({ timestamp: -1 });  // Index for time-based queries
externalDataSchema.index({ type: 1, severity: 1 });  // Index for filtering

const ExternalData = mongoose.model('ExternalData', externalDataSchema);

export default ExternalData;