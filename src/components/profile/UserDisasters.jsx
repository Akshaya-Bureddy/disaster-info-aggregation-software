import React from 'react';
import { FaTrash, FaImage, FaVideo } from 'react-icons/fa';
import './UserDisasters.css';

function UserDisasters({ disasters, onDeleteDisaster }) {
  if (!disasters || disasters.length === 0) {
    return (
      <div className="user-disasters">
        <h2>Your Reported Disasters</h2>
        <p>No disasters reported yet.</p>
      </div>
    );
  }

  // Add console.log to check if token exists
    const token = localStorage.getItem('authToken');
    console.log('Auth Token:', token);
  
    return (
      <div className="user-disasters">
        <h2>Your Reported Disasters</h2>
        <div className="disasters-grid">
          {disasters.map((disaster) => (
            <div key={disaster._id} className="disaster-card">
              <div className="media-container">
                {disaster.images && disaster.images.length > 0 && (
  
<div className="images-container">
                    <img 
                      src={`http://localhost:5000/uploads/${disaster.images[0].split('/').pop()}`}
                      alt={disaster.type}
                    />
                    {disaster.images.length > 1 && (
                      <span className="media-count">
                        <FaImage /> +{disaster.images.length - 1}
                      </span>
                    )}
                  </div>
                )}
                {disaster.videos && disaster.videos.length > 0 && (
                  <span className="video-indicator">
                    <FaVideo /> {disaster.videos.length}
                  </span>
                )}
              </div>
              <div className="disaster-info">
                <div className="disaster-header">
                  <h3>{disaster.type}</h3>
                  <span className={`status-badge ${disaster.status}`}>
                    {disaster.status}
                  </span>
                </div>
                <p>{disaster.description}</p>
                <p className="disaster-date">
                  {new Date(disaster.createdAt).toLocaleDateString()}
                </p>
                <div className="disaster-severity">
                  Severity: <span className={`severity-${disaster.severity}`}>
                    {disaster.severity}
                  </span>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => onDeleteDisaster(disaster._id)}
                >
                  <FaTrash /> Delete Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}

export default UserDisasters;