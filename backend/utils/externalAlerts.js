import fetch from 'node-fetch';

const MIN_MAGNITUDE = 2.5;

async function fetchEarthquakeAlerts() {
  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endTime=${endTime}&minmagnitude=${MIN_MAGNITUDE}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features.map(feature => ({
      source: 'usgs',
      type: 'earthquake',
      title: `Magnitude ${feature.properties.mag} Earthquake`,
      content: feature.properties.place,
      severity: getSeverityFromMagnitude(feature.properties.mag),
      location: {
        type: 'Point',
        coordinates: feature.geometry.coordinates,
        address: feature.properties.place
      },
      timestamp: new Date(feature.properties.time),
      lastUpdated: new Date()
    }));
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    return [];
  }
}

async function fetchWildfireAlerts() {
  const url = 'https://firms.modaps.eosdis.nasa.gov/api/country/csv/2c55320f955eabf5e13b8785f7e0a0fe/VIIRS_SNPP_NRT/world/1';
  try {
    const response = await fetch(url);
    const data = await response.text();
    const rows = data.split('\n').slice(1);
    
    return rows.map(row => {
      const [latitude, longitude, brightness] = row.split(',');
      return {
        source: 'nasa_firms',
        type: 'wildfire',
        title: 'Active Wildfire Detected',
        content: `Fire detected with brightness: ${brightness}`,
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        severity: getSeverityFromFireBrightness(parseFloat(brightness)),
        timestamp: new Date(),
        lastUpdated: new Date()
      };
    }).filter(alert => alert.location.coordinates.every(coord => !isNaN(coord)));
  } catch (error) {
    console.error('Error fetching wildfire data:', error);
    return [];
  }
}

async function fetchStormAlerts() {
  const url = 'https://api.weather.gov/alerts/active?event=Severe%20Storm,Hurricane,Tornado';
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features.map(feature => ({
      source: 'noaa',
      type: 'severe_storm',
      title: feature.properties.headline,
      content: feature.properties.description,
      location: {
        type: 'Point',
        coordinates: [feature.properties.longitude, feature.properties.latitude],
        address: feature.properties.areaDesc
      },
      severity: mapNoaaSeverity(feature.properties.severity),
      timestamp: new Date(feature.properties.sent),
      lastUpdated: new Date()
    }));
  } catch (error) {
    console.error('Error fetching storm data:', error);
    return [];
  }
}

function getSeverityFromFireBrightness(brightness) {
  if (brightness > 400) return 'HIGH';
  if (brightness > 300) return 'MEDIUM';
  return 'LOW';
}

function mapNoaaSeverity(severity) {
  const severityMap = {
    'Extreme': 'CRITICAL',
    'Severe': 'HIGH',
    'Moderate': 'MEDIUM',
    'Minor': 'LOW'
  };
  return severityMap[severity] || 'MEDIUM';
}

export async function fetchExternalAlerts() {
  try {
    const [earthquakes, wildfires, storms] = await Promise.all([
      fetchEarthquakeAlerts(),
      fetchWildfireAlerts(),
      fetchStormAlerts()
    ]);

    return [...earthquakes, ...wildfires, ...storms];
  } catch (error) {
    console.error('Error fetching external alerts:', error);
    return [];
  }
}