import axios from 'axios';
import cron from 'node-cron';
import ExternalData from '../models/ExternalData.js';

const monitoringGrid = {
  minLat: -60,
  maxLat: 75,
  minLon: -180,
  maxLon: 180,
  step: 20
};

// Add to utils object
const utils = {
  async saveDisasterData(data) {
    try {
      const existing = await ExternalData.findOne({
        type: data.type,
        'location.coordinates': data.location.coordinates,
        timestamp: data.timestamp
      });
      
      if (!existing) {
        await ExternalData.create(data);
        console.log(`Saved new ${data.type} disaster data`);
      }
    } catch (error) {
      console.error('Error saving disaster data:', error.message);
    }
  },

  normalizeDisasterType(type) {
    const typeMap = {
      'Severe Storms': 'severe_storm',
      'Volcanoes': 'volcano',
      'Floods': 'flood',
      'Wildfires': 'wildfire',
      'Drought': 'drought',
      'Temperature Extremes': 'extreme_weather',
      'Earthquakes': 'earthquake'
    };
    return typeMap[type] || null;
  },

  getWeatherDisasterType(weatherData) {
    const conditions = weatherData.weather[0].main.toLowerCase();
    const temp = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;

    if (windSpeed > 20) return 'severe_storm';
    if (temp > 40) return 'extreme_weather';
    if (conditions.includes('tornado')) return 'tornado';
    if (conditions.includes('hurricane')) return 'hurricane';
    if (conditions.includes('flood')) return 'flood';
    return null;
  },

  getSeverityFromMagnitude(magnitude) {
    if (magnitude >= 7) return 'HIGH';
    if (magnitude >= 5) return 'MEDIUM';
    return 'LOW';
  },

  getSeverityFromEvent(event) {
    const severityMap = {
      'Severe Storms': 'HIGH',
      'Volcanoes': 'HIGH',
      'Floods': 'HIGH',
      'Wildfires': 'HIGH',
      'Drought': 'MEDIUM'
    };
    return severityMap[event.categories[0].title] || 'MEDIUM';
  },

  getSeverityFromWeather(weatherData) {
    const temp = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;
    const rain = weatherData.rain?.['1h'] || 0;

    if (temp > 45 || temp < -20 || windSpeed > 25 || rain > 100) return 'HIGH';
    if (temp > 40 || temp < -10 || windSpeed > 15 || rain > 50) return 'MEDIUM';
    return 'LOW';
  },

  getSeverityFromFireBrightness(brightness) {
    if (brightness > 400) return 'HIGH';
    if (brightness > 300) return 'MEDIUM';
    return 'LOW';
  },

  mapNoaaSeverity(severity) {
    const severityMap = {
      'Extreme': 'HIGH',
      'Severe': 'HIGH',
      'Moderate': 'MEDIUM',
      'Minor': 'LOW'
    };
    return severityMap[severity] || 'MEDIUM';
  },

  isExtremeWeather(weatherData) {
    return this.getSeverityFromWeather(weatherData) !== 'LOW';
  },

  // Add new severity calculation functions
  getSeverityFromFloodData(waterLevel, rainfall) {
    if (waterLevel > 5 || rainfall > 300) return 'HIGH';
    if (waterLevel > 3 || rainfall > 200) return 'MEDIUM';
    return 'LOW';
  },

  getSeverityFromCycloneData(windSpeed, pressure) {
    if (windSpeed > 118 || pressure < 920) return 'HIGH';
    if (windSpeed > 63 || pressure < 980) return 'MEDIUM';
    return 'LOW';
  }
};

// Add these new functions before fetchGlobalDisasters
async function fetchDetailedFloodData() {
  try {
    for (let lat = monitoringGrid.minLat; lat <= monitoringGrid.maxLat; lat += monitoringGrid.step) {
      for (let lon = monitoringGrid.minLon; lon <= monitoringGrid.maxLon; lon += monitoringGrid.step) {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat,
            lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: 'metric'
          }
        });

        if (response.data.rain || response.data.main.humidity > 85) {
          await utils.saveDisasterData({
            source: 'weather',
            type: 'flood',
            title: 'Flood Alert',
            content: 'Heavy rainfall and flooding conditions detected',
            location: {
              type: 'Point',
              coordinates: [lon, lat],
              address: response.data.name
            },
            severity: utils.getSeverityFromFloodData(
              response.data.rain?.['1h'] || 0,
              response.data.rain?.['3h'] || 0
            ),
            floodData: {
              waterLevel: response.data.rain?.['1h'] || 0,
              rainfall: response.data.rain?.['3h'] || 0,
              affectedArea: response.data.name,
              evacuationStatus: 'monitoring'
            },
            timestamp: new Date()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching detailed flood data:', error.message);
  }
}

async function fetchCycloneData() {
  try {
    for (let lat = monitoringGrid.minLat; lat <= monitoringGrid.maxLat; lat += monitoringGrid.step) {
      for (let lon = monitoringGrid.minLon; lon <= monitoringGrid.maxLon; lon += monitoringGrid.step) {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat,
            lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: 'metric'
          }
        });

        if (response.data.wind.speed > 30) {
          await utils.saveDisasterData({
            source: 'weather',
            type: 'cyclone',
            title: 'Cyclone Alert',
            content: 'High wind speeds indicating cyclonic conditions',
            location: {
              type: 'Point',
              coordinates: [lon, lat],
              address: response.data.name
            },
            severity: utils.getSeverityFromCycloneData(
              response.data.wind.speed,
              response.data.main.pressure
            ),
            cycloneData: {
              category: Math.ceil(response.data.wind.speed / 20),
              windSpeed: response.data.wind.speed,
              pressure: response.data.main.pressure,
              stormSurge: 0,
              predictedPath: [[lon, lat]]
            },
            timestamp: new Date()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching cyclone data:', error.message);
  }
}

async function fetchEarthquakeData() {
  const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
  for (const feature of response.data.features) {
    await utils.saveDisasterData({
      source: 'usgs',
      type: 'earthquake',
      title: `Magnitude ${feature.properties.mag} Earthquake`,
      content: feature.properties.place,
      location: {
        type: 'Point',
        coordinates: feature.geometry.coordinates.slice(0, 2),
        address: feature.properties.place
      },
      severity: utils.getSeverityFromMagnitude(feature.properties.mag),
      timestamp: new Date(feature.properties.time)
    });
  }
}

async function fetchNASAEvents() {
  const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events');
  for (const event of response.data.events) {
    const type = utils.normalizeDisasterType(event.categories[0].title);
    if (type) {
      await utils.saveDisasterData({
        source: 'nasa',
        type,
        title: event.title,
        content: `${event.categories[0].title} event detected`,
        location: {
          type: 'Point',
          coordinates: event.geometry[0].coordinates,
          address: event.title
        },
        severity: utils.getSeverityFromEvent(event),
        timestamp: new Date(event.geometry[0].date)
      });
    }
  }
}

async function fetchWeatherData() {
  for (let lat = monitoringGrid.minLat; lat <= monitoringGrid.maxLat; lat += monitoringGrid.step) {
    for (let lon = monitoringGrid.minLon; lon <= monitoringGrid.maxLon; lon += monitoringGrid.step) {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric'
        }
      });

      const weatherType = utils.getWeatherDisasterType(response.data);
      if (weatherType) {
        await utils.saveDisasterData({
          source: 'weather',
          type: weatherType,
          title: `${weatherType.charAt(0).toUpperCase() + weatherType.slice(1)} Alert`,
          content: response.data.weather[0].description,
          location: {
            type: 'Point',
            coordinates: [lon, lat],
            address: response.data.name
          },
          severity: utils.getSeverityFromWeather(response.data),
          temperature: response.data.main.temp,
          humidity: response.data.main.humidity,
          windSpeed: response.data.wind.speed
        });
      }
    }
  }
}

async function fetchFloodData() {
  const response = await axios.get(`https://api.weather.gov/alerts/active?event=Flood`);
  for (const alert of response.data.features) {
    await utils.saveDisasterData({
      source: 'noaa',
      type: 'flood',
      title: alert.properties.headline,
      content: alert.properties.description,
      location: {
        type: 'Point',
        coordinates: [alert.properties.longitude, alert.properties.latitude],
        address: alert.properties.areaDesc
      },
      severity: utils.mapNoaaSeverity(alert.properties.severity),
      timestamp: new Date(alert.properties.sent)
    });
  }
}

async function fetchWildfireData() {
  const response = await axios.get('https://firms.modaps.eosdis.nasa.gov/api/country/csv/2c55320f955eabf5e13b8785f7e0a0fe/VIIRS_SNPP_NRT/USA/1');
  const fires = response.data.split('\n').slice(1);
  for (const fire of fires) {
    const [lat, lon, brightness] = fire.split(',');
    if (lat && lon) {
      await utils.saveDisasterData({
        source: 'nasa_firms',
        type: 'wildfire',
        title: 'Active Wildfire Detected',
        content: `Fire detected with brightness: ${brightness}`,
        location: {
          type: 'Point',
          coordinates: [parseFloat(lon), parseFloat(lat)],
          address: 'Remote sensing detection'
        },
        severity: utils.getSeverityFromFireBrightness(parseFloat(brightness)),
        timestamp: new Date()
      });
    }
  }
}

async function fetchStormData() {
  const response = await axios.get('https://api.weather.gov/alerts/active?event=Severe%20Storm');
  for (const alert of response.data.features) {
    await utils.saveDisasterData({
      source: 'noaa',
      type: 'severe_storm',
      title: alert.properties.headline,
      content: alert.properties.description,
      location: {
        type: 'Point',
        coordinates: [alert.properties.longitude, alert.properties.latitude],
        address: alert.properties.areaDesc
      },
      severity: utils.mapNoaaSeverity(alert.properties.severity),
      timestamp: new Date(alert.properties.sent)
    });
  }
}

// Add these new functions
async function fetchVolcanoData() {
  try {
    const response = await axios.get('https://volcano.si.edu/api/volcano_data_v1');
    for (const volcano of response.data.volcanoes) {
      if (volcano.activity_level > 1) {
        await utils.saveDisasterData({
          source: 'usgs',
          type: 'volcano',
          title: `Volcanic Activity: ${volcano.name}`,
          content: `Activity level: ${volcano.activity_level}`,
          location: {
            type: 'Point',
            coordinates: [volcano.longitude, volcano.latitude],
            address: volcano.location
          },
          severity: volcano.activity_level > 2 ? 'HIGH' : 'MEDIUM',
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error fetching volcano data:', error.message);
  }
}

async function fetchTsunamiData() {
  try {
    const response = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
      params: {
        format: 'geojson',
        eventtype: 'tsunami',
        orderby: 'time'
      }
    });
    
    for (const feature of response.data.features) {
      await utils.saveDisasterData({
        source: 'usgs',
        type: 'tsunami',
        title: `Tsunami Alert`,
        content: feature.properties.place,
        location: {
          type: 'Point',
          coordinates: feature.geometry.coordinates.slice(0, 2),
          address: feature.properties.place
        },
        severity: feature.properties.tsunami > 1 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date(feature.properties.time)
      });
    }
  } catch (error) {
    console.error('Error fetching tsunami data:', error.message);
  }
}

async function fetchDroughtData() {
  try {
    const response = await axios.get('https://api.weather.gov/alerts/active', {
      params: {
        event: 'Drought'
      }
    });

    for (const alert of response.data.features) {
      await utils.saveDisasterData({
        source: 'noaa',
        type: 'drought',
        title: alert.properties.headline,
        content: alert.properties.description,
        location: {
          type: 'Point',
          coordinates: [alert.properties.longitude, alert.properties.latitude],
          address: alert.properties.areaDesc
        },
        severity: utils.mapNoaaSeverity(alert.properties.severity),
        timestamp: new Date(alert.properties.sent)
      });
    }
  } catch (error) {
    console.error('Error fetching drought data:', error.message);
  }
}

// Update fetchGlobalDisasters function
async function fetchGlobalDisasters() {
  try {
    console.log('Starting disaster data collection...');
    
    const results = await Promise.allSettled([
      fetchEarthquakeData(),
      fetchNASAEvents(),
      fetchWeatherData(),
      fetchDetailedFloodData(),
      fetchCycloneData(),
      fetchWildfireData(),
      fetchStormData(),
      fetchVolcanoData(),
      fetchTsunamiData(),
      fetchDroughtData()
    ]);
    
    // Log which services succeeded/failed
    results.forEach((result, index) => {
      const services = ['Earthquake', 'NASA', 'Weather', 'Flood', 'Cyclone', 'Wildfire', 'Storm', 'Volcano', 'Tsunami', 'Drought'];
      if (result.status === 'rejected') {
        console.error(`${services[index]} data collection failed:`, result.reason);
      } else {
        console.log(`${services[index]} data collection completed`);
      }
    });
    
    console.log('Disaster data collection completed');
  } catch (error) {
    console.error('Error collecting global disaster data:', error.message);
  }
}

export function startDataCollection() {
  console.log('Global disaster monitoring service initialized');
  fetchGlobalDisasters();
  cron.schedule('*/15 * * * *', fetchGlobalDisasters);
}
