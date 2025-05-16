import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createDisaster } from '../../api';
import './ReportDisaster.css';

function ReportDisaster() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    location: { type: 'Point', coordinates: [] },
    severity: 'medium',
    description: '',
    peopleAffected: '',
    infrastructure: '',
    images: [],
    videos: [],
    timestamp: new Date().toISOString(),
    source: 'user_report',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({
        ...prev,
        [name]: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude]
          }
        }));
      }, (error) => {
        console.error('Error fetching location:', error);
        setError('Unable to fetch location. Please enter manually.');
      });
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.type || !formData.description || !formData.location.coordinates.length) {
        throw new Error('Please fill in all required fields and set location');
      }

      const formDataToSend = new FormData();
      
      // Log the complete form data for debugging
      console.log('Form Data:', {
        type: formData.type,
        description: formData.description,
        location: formData.location,
        images: formData.images.length,
        videos: formData.videos.length
      });
      
      const title = `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Disaster Report`;
      formDataToSend.append('title', title);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('severity', formData.severity);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('peopleAffected', formData.peopleAffected.toString());
      formDataToSend.append('infrastructure', formData.infrastructure);
      formDataToSend.append('timestamp', new Date().toISOString());
      formDataToSend.append('source', 'user_report');
      formDataToSend.append('status', 'pending');

      // Log FormData contents
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      formData.videos.forEach((video) => {
        formDataToSend.append('videos', video);
      });

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Log request details
      console.log('Request Details:', {
        token: token ? 'Present' : 'Missing',
        contentType: formDataToSend.get('type'),
        hasImages: formDataToSend.getAll('images').length > 0,
        hasVideos: formDataToSend.getAll('videos').length > 0
      });

      try {
        const response = await createDisaster(formDataToSend, token);
        console.log('API Response:', response);
    
        if (response?.data) {
          setSuccess(true);
          setTimeout(() => navigate('/feed'), 2000);
        } else {
          console.error('Invalid Response Structure:', response);
          throw new Error('Invalid response format from server');
        }
      } catch (apiError) {
        // Enhanced error logging
        console.error('API Error Details:', {
          name: apiError.name,
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          responseData: apiError.response?.data,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            headers: apiError.config?.headers
          }
        });
        
        throw new Error(
          apiError.response?.data?.message || 
          apiError.message || 
          'Server error while creating disaster report'
        );
      }
      
    } catch (err) {
      console.error('Final Error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="report-container">
      <h2>{t('Report a Disaster')}</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Disaster reported successfully!</p>}

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label>{t('Disaster Type')}</label>
          <select name="type" value={formData.type} onChange={handleChange} required>
            <option value="">Select Type</option>
            <option value="earthquake">Earthquake</option>
            <option value="flood">Flood</option>
            <option value="fire">Fire</option>
            <option value="cyclone">Cyclone</option>
            <option value="landslide">Landslide</option>
            <option value="tsunami">Tsunami</option>
            <option value="tornado">Tornado</option>
            <option value="industrial">Industrial Accident</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>{t('Description')}</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Provide detailed information about the disaster..."
            required 
          />
        </div>

        <div className="form-group">
          <label>{t('Severity')}</label>
          <select name="severity" value={formData.severity} onChange={handleChange} required>
            <option value="low">Low - Minor Impact</option>
            <option value="medium">Medium - Moderate Impact</option>
            <option value="high">High - Major Impact</option>
            <option value="critical">Critical - Severe Impact</option>
          </select>
        </div>

        <div className="form-group">
          <label>{t('People Affected')}</label>
          <input 
            type="number" 
            name="peopleAffected" 
            value={formData.peopleAffected} 
            onChange={handleChange}
            placeholder="Estimated number of people affected"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>{t('Infrastructure Affected')}</label>
          <input 
            type="text" 
            name="infrastructure" 
            value={formData.infrastructure} 
            onChange={handleChange}
            placeholder="Buildings, roads, utilities, etc."
            required
          />
        </div>

        <div className="form-group">
          <label>{t('Location')}</label>
          <div className="location-group">
            <button type="button" className="location-btn" onClick={handleLocation}>
              Use Current Location
            </button>
            {formData.location.coordinates.length > 0 && (
              <span className="location-info">
                Location set: {formData.location.coordinates[1]}, {formData.location.coordinates[0]}
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>{t('Upload Images')}</label>
          <input 
            type="file" 
            name="images" 
            multiple 
            accept="image/*" 
            onChange={handleChange}
            className="file-input"
          />
        </div>

        <div className="form-group">
          <label>{t('Upload Videos')}</label>
          <input 
            type="file" 
            name="videos" 
            multiple 
            accept="video/*" 
            onChange={handleChange}
            className="file-input"
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

export default ReportDisaster;