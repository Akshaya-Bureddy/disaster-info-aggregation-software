import axios from 'axios';

// API Keys and Base URLs
const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '274fe37de6d90045d428bc953b1f396e';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '7e59367a497246d087fa6480104f59fc';
const NEWS_BASE_URL = 'https://newsapi.org/v2';
const BASE_URL = 'http://localhost:5000/api/externaldatas';

// Weather related functions
export const getWeatherData = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw new Error('Failed to fetch weather data');
  }
};

export const getWeatherAlerts = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/onecall`, {
      params: {
        lat,
        lon,
        exclude: 'current,minutely,hourly,daily',
        appid: WEATHER_API_KEY
      }
    });
    return response.data.alerts || [];
  } catch (error) {
    console.error('Error fetching weather alerts:', error.message);
    return [];
  }
};

// Helper functions
const getSeverityFromMagnitude = (magnitude) => {
  if (magnitude >= 6) return 'High';
  if (magnitude >= 4) return 'Medium';
  return 'Low';
};

const isRecentEvent = (dateString) => {
  const eventDate = new Date(dateString);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return eventDate >= oneDayAgo;
};

const convertEonetCategory = (category) => {
  const categoryMap = {
    'Wildfires': 'Wildfire',
    'Severe Storms': 'Thunderstorm',
    'Volcanoes': 'Volcanic Activity',
    'Floods': 'Flood'
  };
  return categoryMap[category] || category;
};

// Disaster and News related functions
export const getDisasterNews = async (pageSize = 10) => {
  try {
    const query = '("natural disaster" OR "severe weather" OR emergency OR catastrophe) AND (casualties OR killed OR injured OR destroyed)';
    
    const response = await axios.get(`${NEWS_BASE_URL}/everything`, {
      params: {
        q: query,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 100,
        apiKey: NEWS_API_KEY,
        domains: 'reuters.com,apnews.com,theguardian.com,bbc.co.uk,aljazeera.com,hindustantimes.com,ndtv.com'
      }
    });

    const filteredArticles = response.data.articles.filter(article => {
      const title = article.title?.toLowerCase() || '';
      const description = article.description?.toLowerCase() || '';
      
      // Comprehensive disaster classification
      const disasterTypes = [
        'earthquake', 'tornado', 'flood', 'storm', 'hurricane', 
        'tsunami', 'wildfire', 'landslide', 'cyclone', 'typhoon', 
        'eruption', 'avalanche', 'mudslide', 'drought'
      ];

      // Precise impact indicators
      const impactIndicators = [
        'killed', 'dead', 'died', 'injured', 'casualties', 
        'destroyed', 'damage', 'emergency', 'evacuate', 
        'rescue', 'devastate', 'fatalities'
      ];

      // Exclusion terms to filter out false positives
      const exclusionTerms = [
        'game', 'player', 'team', 'match', 'sport', 
        'movie', 'film', 'celebrity', 'social media', 
        'market', 'stock', 'business', 'economic', 
        'political', 'election', 'memorial', 'concert'
      ];

      // Magnitude and severity terms
      const severityTerms = [
        'massive', 'severe', 'major', 'powerful', 
        'devastating', 'critical', 'extreme'
      ];

      // Check presence of disaster types
      const hasDisasterType = disasterTypes.some(type => 
        title.includes(type) || description.includes(type)
      );

      // Check presence of impact indicators
      const hasImpactIndicator = impactIndicators.some(indicator => 
        title.includes(indicator) || description.includes(indicator)
      );

      // Check absence of exclusion terms
      const hasNoExclusionTerms = !exclusionTerms.some(term => 
        title.includes(term) || description.includes(term)
      );

      // Optional: severity check for more significant events
      const hasSeverityIndicator = severityTerms.some(term => 
        title.includes(term) || description.includes(term)
      );

      // Ensure the article meets multiple criteria
      return (
        hasDisasterType && 
        hasImpactIndicator && 
        hasNoExclusionTerms && 
        (hasSeverityIndicator || hasImpactIndicator)
      );
    });

    // Additional sorting to prioritize most recent and significant events
    const sortedArticles = filteredArticles.sort((a, b) => {
      // Prioritize articles with severity terms and more recent publications
      const aScore = (
        (a.title?.toLowerCase().split(' ').some(word => 
          ['massive', 'severe', 'devastating'].includes(word)) ? 10 : 0) +
        (new Date(a.publishedAt).getTime() / 10000)
      );

      const bScore = (
        (b.title?.toLowerCase().split(' ').some(word => 
          ['massive', 'severe', 'devastating'].includes(word)) ? 10 : 0) +
        (new Date(b.publishedAt).getTime() / 10000)
      );

      return bScore - aScore;
    });

    return sortedArticles.slice(0, pageSize);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

export const convertNewsToFeed = (article, index) => {
  return {
    id: `news-${index}`,
    platform: 'News',
    content: article.title || 'News update',
    source: article.source?.name || 'News Source',
    timestamp: article.publishedAt ? new Date(article.publishedAt).toLocaleString() : new Date().toLocaleString(),
    url: article.url || '#',
    imageUrl: article.urlToImage || null
  };
};

// Remove this duplicate function
// export const convertNewsToFeed = (news) => ({
//   _id: news.id,
//   content: `${news.title}\n\n${news.content || ''}`,
//   image: news.image,
//   url: news.url,
//   timestamp: news.timestamp,
//   platform: 'News',
//   source: news.source
// });
// Remove this duplicate empty getWeatherData function since we already have a complete version above
// export const getWeatherData = async () => {
//   return [];
// };

// Remove this simple version since we have a more detailed version below
// export const convertWeatherToAlert = (weather) => ({
//   ...weather
// });

export const getAnalyticsData = async () => {
  try {
    const response = await axios.get(BASE_URL);
    const disasters = response.data || [];
    
    return {
      disasters,
      totalAlerts: disasters.length,
      alertsByType: disasters.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {}),
      alertsByLocation: disasters.reduce((acc, d) => {
        acc[d.location] = (acc[d.location] || 0) + 1;
        return acc;
      }, {}),
      alertsByPriority: disasters.reduce((acc, d) => {
        acc[d.severity] = (acc[d.severity] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error.message);
    return {
      disasters: [],
      totalAlerts: 0,
      alertsByType: {},
      alertsByLocation: {},
      alertsByPriority: {}
    };
  }
};

export const getLocalDisasterNews = async (location, pageSize = 5) => {
  try {
    const response = await axios.get(`${NEWS_BASE_URL}/everything`, {
      params: {
        q: location,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize,
        apiKey: NEWS_API_KEY
      }
    });
    return response.data.articles || [];
  } catch (error) {
    console.error('Error fetching local news:', error.message);
    return [];
  }
};

export const getTopHeadlines = async (country = 'us', category = 'general', pageSize = 5) => {
  try {
    const response = await axios.get(`${NEWS_BASE_URL}/top-headlines`, {
      params: {
        country,
        category,
        pageSize,
        apiKey: NEWS_API_KEY
      }
    });
    return response.data.articles || [];
  } catch (error) {
    console.error('Error fetching headlines:', error.message);
    return [];
  }
};

export const convertWeatherToAlert = (weatherData) => {
  let type = 'Normal';
  let severity = 'Low';
  
  if (weatherData.weather && weatherData.weather[0]) {
    const weatherId = weatherData.weather[0].id;
    
    if (weatherId >= 200 && weatherId < 300) {
      type = 'Thunderstorm';
      severity = weatherId >= 210 ? 'High' : 'Medium';
    } else if ((weatherId >= 300 && weatherId < 400) || (weatherId >= 500 && weatherId < 600)) {
      type = 'Flood Risk';
      severity = weatherId >= 502 ? 'High' : 'Medium';
    } else if (weatherId >= 600 && weatherId < 700) {
      type = 'Snowstorm';
      severity = weatherId >= 602 ? 'High' : 'Medium';
    } else if (weatherId >= 700 && weatherId < 800) {
      type = 'Atmospheric';
      severity = 'Medium';
    } else if (weatherId === 900 || weatherId === 901 || weatherId === 902 || weatherId === 962) {
      type = 'Extreme Weather';
      severity = 'Critical';
    } else if (weatherId === 781) {
      type = 'Tornado';
      severity = 'Critical';
    } else if (weatherId === 961 || weatherId === 962) {
      type = 'Hurricane';
      severity = 'Critical';
    }
  }
  
  return {
    id: `weather-${weatherData.id}`,
    type,
    location: `${weatherData.name}, ${weatherData.sys.country}`,
    severity,
    timestamp: new Date().toLocaleTimeString(),
    coordinates: [weatherData.coord.lat, weatherData.coord.lon],
    description: weatherData.weather[0].description,
    temperature: weatherData.main.temp,
    humidity: weatherData.main.humidity,
    windSpeed: weatherData.wind.speed
  };
};

// Add this near the top with other export functions
export const getGlobalDisasters = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/global`);
    return response.data;
  } catch (error) {
    console.error('Error fetching global disasters:', error);
    return [];
  }
};