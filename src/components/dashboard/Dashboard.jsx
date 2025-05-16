import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaBell, FaMap, FaChartBar, FaCog, FaLocationArrow, FaPlus, FaTwitter, FaNewspaper, FaShieldAlt, FaFire, FaWater, FaWind, FaCloudRain, FaSnowflake, FaCloudSun } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { AuthContext } from '../../contexts/AuthContext';
import { getGlobalDisasters, getWeatherData, getDisasterNews } from '../../api/externalApis';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

// Define convertNewsToFeed at the top level
const convertNewsToFeed = (article, index) => ({
  id: `news-${index}`,
  platform: 'News',
  content: article.title,
  source: article.source?.name || 'News Source',
  timestamp: article.publishedAt || new Date().toISOString(),
  url: article.url,
  image: article.urlToImage
});

// Leaflet configuration
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Add this custom hook at the top of your file, after the imports
// Update the useDisasterData hook
// First, import useCallback
//import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';

// Remove the duplicate React import below and continue with the hook
function useDisasterData() {
  const [data, setData] = useState([]);
  const [newsFeeds, setNewsFeeds] = useState([]);

  const fetchDisasters = useCallback(async (token) => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

      const [disasterResponse, newsArticles] = await Promise.all([
        axios.get('http://localhost:5000/api/externaldatas/range', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: {
            startDate: twentyFourHoursAgo.toISOString(),
            endDate: now.toISOString()
          }
        }),
        getDisasterNews()
      ]);
      
      setData(disasterResponse.data || []);
      setNewsFeeds((newsArticles || []).map((article, index) => convertNewsToFeed(article, index)));
    } catch (error) {
      console.error('Error fetching disaster data:', error);
      setData([]);
      setNewsFeeds([]);
    }
  }, []);

  return { data, newsFeeds, fetchDisasters };
}

// Update the Dashboard component's useEffect
// Add this near the top of the Dashboard component
function Dashboard() {
  const { user } = useContext(AuthContext);
  console.log('User data:', user); // Add this line to debug

  // Add the useDisasterData hook
  const { data: disasterData, newsFeeds: latestNews, fetchDisasters } = useDisasterData();
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socialFeeds, setSocialFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allDisasters, setAllDisasters] = useState([]);
  const mapRef = useRef(null);

  // In your useEffect
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to view the dashboard');
          return;
        }
        await fetchDisasters(token);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to load disaster data. Please try again later.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, fetchDisasters]);

  // Add this right after the imports, before any other code
  // Move convertNewsToFeed to the top level, right after imports
  const convertNewsToFeed = (article, index) => ({
    id: `news-${index}`,
    platform: 'News',
    content: article.title,
    source: article.source?.name || 'News Source',
    timestamp: article.publishedAt || new Date().toISOString(),
    url: article.url,
    image: article.urlToImage
  });
  
  // Remove the convertNewsToFeed function from inside the useEffect
  useEffect(() => {
    if (disasterData && latestNews) {
      // Add debugging to see what types we're receiving
      console.log('Disaster Types:', disasterData.map(d => d.type));
      
      setAllDisasters(disasterData);
      
      // Strict filtering for Indian disasters only
      const indianDisasters = disasterData.filter(disaster => {
        const location = disaster.location?.address?.toLowerCase() || '';
        return /\b(india|delhi|mumbai|bangalore|kolkata|chennai)\b/.test(location) && 
        !location.includes('indiana') && 
        !location.includes('indianapolis');
});
  
      // Log filtered disasters
      console.log('Indian Disasters:', indianDisasters.map(d => ({
        type: d.type,
        location: d.location?.address,
        severity: d.severity
      })));
  
      setAlerts(indianDisasters);
      setNotifications(indianDisasters.map(alert => ({
        id: `notification-${alert._id}`,
        type: alert.type,
        location: alert.location,
        severity: alert.severity,
        time: new Date(alert.timestamp).toLocaleString(),
        content: alert.content
      })));
  
      setSocialFeeds(latestNews); // Keep all news feeds
      setLoading(false);
    }
  }, [disasterData, latestNews]);

  const getDisasterIcon = (type) => {
    const normalizedType = type?.toLowerCase().trim() || '';
    
    switch (normalizedType) {
      case 'earthquake':
      case 'seismic activity':
      case 'tremor':
        return <FaExclamationTriangle />;
      
      case 'flood':
      case 'flood risk':
      case 'flooding':
      case 'flash flood':
      case 'coastal flood':
      case 'river flood':
        return <FaWater />;
      
      case 'wildfire':
      case 'fire':
      case 'forest fire':
      case 'bush fire':
        return <FaFire />;
      
      // Combined all storm-related cases
      case 'hurricane':
      case 'cyclone':
      case 'typhoon':
      case 'tropical storm':
      case 'storm':
      case 'severe storm':
      case 'severe_storm':
        return <FaWind />;
      
      // Combined all thunderstorm and rain-related cases
      case 'thunderstorm':
      case 'lightning':
      case 'hailstorm':
      case 'rain':
        return <FaCloudRain />;
      
      case 'snowstorm':
      case 'blizzard':
      case 'winter storm':
      case 'ice storm':
      case 'avalanche':
        return <FaSnowflake />;
      
      case 'atmospheric':
      case 'fog':
      case 'heat wave':
      case 'drought':
      case 'air quality':
      case 'dust storm':
        return <FaCloudSun />;
      
      default:
        console.log('Unhandled disaster type:', type);
        return <FaExclamationTriangle />;
    }
  };

  const handleViewDetails = (alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    console.log('Viewing details for alert:', alert);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleDeleteFeed = async (feedId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      await axios.delete(`http://localhost:5000/api/disasters/${feedId}`, config);
      setSocialFeeds(prevFeeds => prevFeeds.filter(feed => feed._id !== feedId));
    } catch (err) {
      console.error('Error deleting feed:', err);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Disaster Information Dashboard</h1>
          {user && (
            <p className="welcome-message">
              Welcome, <span className="welcome-name">{user.username || user.email || 'User'}</span>
            </p>
          )}
        </div>
        <div className="header-actions">
          <div className="notification-wrapper">
            <button className="notification-btn" onClick={toggleNotifications}>
              <FaBell /> Notifications
              {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                <h3>Recent Notifications</h3>
                {notifications.length > 0 ? notifications.map(notification => (
                  <div key={notification.id} className="notification-item">
                    <div className="notification-type">
                      {getDisasterIcon(notification.type)} {notification.type}
                    </div>
                    <div className="notification-location">
                      <FaLocationArrow /> {notification.location?.address || 'Unknown location'}
                    </div>
                    <div className={`notification-severity ${notification.severity?.toLowerCase()}`}>
                      {notification.severity}
                    </div>
                    <small>{notification.time}</small>
                  </div>
                )) : (
                  <div className="notification-item">
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link to="/settings">
            <button className="settings-btn">
              <FaCog /> Settings
            </button>
          </Link>
        </div>
      </header>

      <Link to="/safety-guides" className="safety-guide-btn">
        <FaShieldAlt /> View Safety Guidelines
      </Link>

      {error && <div className="alert">{error}</div>}

      <section className="alerts-section">
        <h2><FaExclamationTriangle /> Active Alerts</h2>
        {loading ? (
          <div className="loading">Loading real-time alerts...</div>
        ) : (
          <div className="alerts-container">
            {alerts.length > 0 ? alerts.map(alert => (
              <div key={alert._id} className="alert-card">
                <div className="alert-type">
                  {getDisasterIcon(alert.type)} {alert.type}
                </div>
                <div className="alert-location">
                  <FaLocationArrow /> {alert.location?.address || 'Unknown location'}
                </div>
                <div className={`alert-severity ${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </div>
                <small>{new Date(alert.timestamp).toLocaleString()}</small>
                {alert.content && <p className="alert-description">{alert.content}</p>}
              </div>
            )) : (
              <p>No active alerts at this time.</p>
            )}
          </div>
        )}
      </section>

      <section className="map-section">
        <h2><FaMap /> Disaster Map</h2>
        <div className="map-container">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={true}
            zoomControl={false}
            ref={mapRef}
            attributionControl={true}
            worldCopyJump={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            <ZoomControl position="bottomright" />
            {allDisasters.map(disaster => (
              <Marker 
                key={disaster._id} 
                position={[
                  disaster.location?.coordinates[1] || 0,
                  disaster.location?.coordinates[0] || 0
                ]}
              >
                <Popup>
                  <strong>{disaster.type}</strong><br />
                  {disaster.location?.address || 'Unknown location'}<br />
                  Severity: {disaster.severity}
                  {disaster.content && <><br />{disaster.content}</>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/feed" className="action-btn">
            <FaChartBar /> View Disaster Feed
          </Link>
          <Link to="/categories" className="action-btn">
            <FaMap /> Emergency Contacts
          </Link>
          <Link to="/analytics" className="action-btn">
            <FaChartBar /> View Analytics
          </Link>
          <Link to="/report" className="action-btn alert-action">
            <FaPlus /> Report New Disaster
          </Link>
        </div>
      </section>

      <section className="social-feeds-section">
        <h2><FaNewspaper /> Latest Disaster News</h2>
        {loading ? (
          <div className="loading">Loading news feeds...</div>
        ) : (
          <div className="feeds-container">
            {socialFeeds.length > 0 ? socialFeeds.map(feed => (
              <div key={feed._id || feed.id} className="feed-card">
                <div className="feed-header">
                  <span className="feed-platform">{feed.platform}</span>
                  <span className="feed-time">{new Date(feed.timestamp).toLocaleString()}</span>
                  {feed.isUserSubmitted && feed.userId === user?.id && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteFeed(feed._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="feed-content">
                  <p>{feed.content}</p>
                  {console.log('Full feed object:', feed)}
                  {feed.image && (
                    <div className="feed-image-container">
                      <img 
                        src={feed.image.startsWith('http') 
                          ? feed.image 
                          : `http://localhost:5000/uploads/${feed.image.replace(/\\/g, '/')}`}
                        alt="Disaster Report"
                        className="feed-image"
                        onError={(e) => {
                          console.error('Image failed to load:', {
                            original: feed.image,
                            attempted: e.target.src
                          });
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                        }}
                      />
                    </div>
                  )}
                  {feed.video && (
                    <div className="feed-video-container">
                      <video 
                        controls
                        className="feed-video"
                        onError={(e) => {
                          console.error('Video failed to load:', feed.video);
                          e.target.style.display = 'none';
                        }}
                      >
                        <source 
                          src={`http://localhost:5000/uploads/${feed.video.replace(/\\/g, '/')}`} 
                          type="video/mp4" 
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  {feed.source && <small>Source: {feed.source}</small>}
                </div>
                {feed.url && (
                  <a href={feed.url} target="_blank" rel="noopener noreferrer" className="feed-link">
                    Read More
                  </a>
                )}
              </div>
            )) : (
              <p>No news feeds available at this time.</p>
            )}
          </div>
        )}
      </section>

      {/* Analytics Overview Section */}
      <section className="analytics-overview">
        <h2><FaChartBar /> Trend Analysis</h2>
        <div className="analytics-grid">
          <div className="trend-card">
            <h3>Most Affected Areas</h3>
            <ul className="trend-list">
              {(() => {
                const locationCounts = {};
                allDisasters.forEach(disaster => {
                  const location = disaster.location?.address || 'Unknown';
                  locationCounts[location] = (locationCounts[location] || 0) + 1;
                });
                
                return Object.entries(locationCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([location, count], index) => (
                    <li key={index}>
                      <FaLocationArrow /> {location} ({count} incidents)
                    </li>
                  ));
              })()}
            </ul>
          </div>
          <div className="trend-card">
            <h3>Common Disaster Types</h3>
            <ul className="trend-list">
              {(() => {
                const typeCounts = {};
                allDisasters.forEach(disaster => {
                  if (disaster.type) {
                    typeCounts[disaster.type] = (typeCounts[disaster.type] || 0) + 1;
                  }
                });
                
                return Object.entries(typeCounts)
                  .map(([type, count]) => ({ 
                    type, 
                    count, 
                    percentage: Math.round((count / Math.max(allDisasters.length, 1)) * 100) 
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                  .map((item, index) => (
                    <li key={index}>
                      {getDisasterIcon(item.type)} {item.type} ({item.percentage}%)
                    </li>
                  ));
              })()}
            </ul>
          </div>
        
        </div>
      </section>
    </div>
  );
}

export default Dashboard;