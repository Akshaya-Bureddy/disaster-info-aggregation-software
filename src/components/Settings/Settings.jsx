import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaMoon, FaSun, FaEdit } from 'react-icons/fa';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    // Apply theme on mount and change
    document.documentElement.setAttribute(
      'data-theme',
      isDarkMode ? 'dark' : 'light'
    );
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleProfileEdit = () => {
    localStorage.setItem('profileEditMode', 'true');
    navigate('/profile');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <Link to="/dashboard" className="home-link">
            <FaHome /> Back to Dashboard
          </Link>
          <h1>Settings</h1>
        </div>

        <div className="settings-content">
          <button 
            className="profile-settings-btn" 
            onClick={handleProfileEdit}
          >
            <FaEdit /> Edit Profile Information
          </button>

          <button 
            className={`theme-toggle-btn ${isDarkMode ? 'dark' : 'light'}`}
            onClick={toggleTheme}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
            {isDarkMode ? ' Light Mode' : ' Dark Mode'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;