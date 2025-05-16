import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaEdit, FaCheck, FaTimes, FaHome } from 'react-icons/fa';
import './Profile.css';
import UserDisasters from './UserDisasters';

function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ...user,
    ...user?.address,
    photoUrl: user?.photoUrl || null
  });
  const [disasters, setDisasters] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        ...user.address,
        photoUrl: user.photoUrl || null
      });
      fetchUserDisasters();
      
      // Check if coming from settings
      const editMode = localStorage.getItem('profileEditMode');
      if (editMode === 'true') {
        setIsEditing(true);
        localStorage.removeItem('profileEditMode');
      }
    }
  }, [user]);

  const fetchUserDisasters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/disasters/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched disasters:', data);
        setDisasters(data);
      }
    } catch (error) {
      console.error('Error fetching disasters:', error);
    }
  };

  const handleDeleteDisaster = async (disasterId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/disasters/${disasterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        // Update the local state to remove the deleted disaster
        setDisasters(prev => prev.filter(d => d._id !== disasterId));
      } else {
        console.error('Failed to delete disaster');
      }
    } catch (error) {
      console.error('Error deleting disaster:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['houseNo', 'street', 'city', 'state', 'pincode'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      ...user,
      ...user.address,
      photoUrl: user?.photoUrl || null
    });
    setIsEditing(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <Link to="/dashboard" className="home-link">
            <FaHome /> Back to Dashboard
          </Link>
          <div className="profile-avatar" onClick={() => isEditing && fileInputRef.current.click()}>
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Profile" className="avatar-image" />
            ) : (
              <FaUser size={50} />
            )}
            {isEditing && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden-input"
              />
            )}
            {isEditing && <div className="avatar-overlay">Click to change photo</div>}
          </div>
          <div className="profile-title">
            <h1>{user.username}</h1>
            <p className="role-badge">{user.role || 'User'}</p>
          </div>
          <button 
            className={`edit-button ${isEditing ? 'editing' : ''}`}
            onClick={() => !isEditing && setIsEditing(true)}
          >
            {isEditing ? <FaCheck /> : <FaEdit />}
          </button>
          
        </div>

        <form onSubmit={handleSubmit} className="profile-details">
          <div className="detail-item">
            <FaIdCard className="detail-icon" />
            <div className="detail-content">
              <label>Username</label>
              <p>{user.username}</p>
            </div>
          </div>

          <div className="detail-item">
            <FaEnvelope className="detail-icon" />
            <div className="detail-content">
              <label>Email</label>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="detail-item">
            <FaPhone className="detail-icon" />
            <div className="detail-content">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <p>{user.phone || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="detail-item">
            <FaMapMarkerAlt className="detail-icon" />
            <div className="detail-content">
              <label>Address</label>
              {isEditing ? (
                <div className="address-inputs">
                  <input
                    type="text"
                    name="houseNo"
                    value={formData.address?.houseNo || ''}
                    onChange={handleChange}
                    placeholder="House/Flat No."
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="street"
                    value={formData.address?.street || ''}
                    onChange={handleChange}
                    placeholder="Street/Area"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="city"
                    value={formData.address?.city || ''}
                    onChange={handleChange}
                    placeholder="City"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="state"
                    value={formData.address?.state || ''}
                    onChange={handleChange}
                    placeholder="State"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={formData.address?.pincode || ''}
                    onChange={handleChange}
                    placeholder="Pincode"
                    className="edit-input"
                  />
                </div>
              ) : (
                <p>
                  {user.address?.houseNo}, {user.address?.street}<br />
                  {user.address?.city}, {user.address?.state} - {user.address?.pincode}
                </p>
              )}
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="detail-item">
              <FaIdCard className="detail-icon" />
              <div className="detail-content">
                <label>Organization</label>
                <p>{user.organization || 'NA'}</p>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="form-actions">
              <button type="submit" className="save-btn">
                <FaCheck /> Save Changes
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </form>

        <div className="profile-stats">
          <div className="stat-card">
            <h3>Reports Submitted</h3>
            <p className="stat-number">{disasters.length}</p>
          </div>
          <div className="stat-card">
            <h3>Alerts Received</h3>
            <p className="stat-number">{user?.alertsCount || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Areas Monitored</h3>
            <p className="stat-number">{user?.areasCount || 0}</p>
          </div>
        </div>

        <UserDisasters 
          disasters={disasters}
          onDeleteDisaster={handleDeleteDisaster}  // Add this prop
        />
      </div>
    </div>
  );
}

export default Profile;