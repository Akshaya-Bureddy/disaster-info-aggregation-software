import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { getLocalDisasters, getGlobalDisasters, getDisasterNews } from '../../api';
import useGeolocation from '../../hooks/useGeolocation';
import { MapPin, AlertTriangle, Newspaper } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import './ActiveAlerts.css';
import './AlertCarousel.css';

const ActiveAlerts = () => {
  const { user } = useContext(AuthContext);
  const [localDisasters, setLocalDisasters] = useState([]);
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [disasterNews, setDisasterNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { location, error: locationError } = useGeolocation();

  // Add this function to filter disasters
  const filteredDisasters = localDisasters.filter(disaster => 
    disaster.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add search input before the carousel
  const renderSearchBar = () => {
    return (
      <div className="search-container mb-4">
        <input
          type="text"
          placeholder="Search by region..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
    );
  };

  const renderAlertCarousel = () => {
    const disastersToShow = searchQuery ? filteredDisasters : localDisasters;

    if (!disastersToShow.length) {
      return <p className="text-gray-500">No active alerts in this region</p>;
    }

    // Create a continuous stream of alerts
    const repeatedAlerts = [...disastersToShow, ...disastersToShow, ...disastersToShow];

    return (
      <div className="carousel-container">
        <div className="carousel-track">
          {repeatedAlerts.map((disaster, index) => (
            <div key={`${disaster._id}-${index}`} className="carousel-item">
              <div className={`alert-content ${getSeverityStyles(disaster.severity)}`}>
                <div className="alert-header">
                  <h3 className="alert-title">{formatDisasterType(disaster.type)}</h3>
                  <span className={`severity-badge severity-${disaster.severity.toLowerCase()}`}>
                    {disaster.severity}
                  </span>
                </div>
                <p className="alert-description">{disaster.description}</p>
                <div className="alert-footer">
                  <p>{disaster.location}</p>
                  <p>{formatTimestamp(disaster.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <AlertTriangle className="text-red-500" />
        <h2 className="alerts-title">
          Active Alerts in {user?.address?.state || 'Your Area'}
        </h2>
      </div>
      {renderSearchBar()}
      {renderAlertCarousel()}
    </div>
  );
};

const getSeverityStyles = (severity) => {
  const styles = {
    'CRITICAL': 'border-red-600 bg-red-50',
    'HIGH': 'border-orange-500 bg-orange-50',
    'MEDIUM': 'border-yellow-500 bg-yellow-50',
    'LOW': 'border-blue-500 bg-blue-50'
  };
  return styles[severity] || 'border-gray-300 bg-gray-50';
};

const formatDisasterType = (type) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.abs(now - date) / 36e5;

  if (diffInHours < 24) {
    return `${Math.round(diffInHours)} hours ago`;
  }
  return date.toLocaleDateString();
};

useEffect(() => {
  const fetchLocationAlerts = async () => {
    try {
      setLoading(true);
      
      if (user?.address) {
        // Debug log to check user location
        console.log('User location:', {
          state: user.address.state,
          city: user.address.city,
          area: user.address.area || user.address.locality
        });

        const response = await axios.get('http://localhost:5000/api/disasters/local', {
          params: {
            state: user.address.state,
            city: user.address.city
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        // Debug log to check received disasters
        console.log('Received disasters:', response.data);

        // Strict location matching
        const localAlerts = response.data.filter(disaster => {
          const disasterLocation = disaster.location.toLowerCase();
          return disasterLocation.includes(user.address.state.toLowerCase());
        });

        // Debug log to check filtered disasters
        console.log('Filtered local alerts:', localAlerts);
        
        setLocalDisasters(localAlerts);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  fetchLocationAlerts();
  const interval = setInterval(fetchLocationAlerts, 3600000);

  return () => clearInterval(interval);
}, [user]);

export default ActiveAlerts;