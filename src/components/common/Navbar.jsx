import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaPhone, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEmergencyDial = () => {
    window.location.href = 'tel:112';
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to={user ? "/dashboard" : "/"} className="logo">
          AlertHub
        </Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <button onClick={handleEmergencyDial} className="emergency-dial-btn">
              <FaPhone /> Emergency Dial
            </button>
            <Link to="/report" className="nav-link emergency-btn">
              <FaExclamationTriangle /> Report Disaster
            </Link>
            <Link to="/profile" className="nav-link profile-btn">
              <FaUser /> Profile
            </Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <Link to="/login" className="nav-link login-btn">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;