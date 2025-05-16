import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

function LandingPage() {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-bell"></i>
            Alert Hub
          </Link>
          <div className="ms-auto">
            <Link to="/login" className="btn btn-outline-light">Login</Link>
            <Link to="/signup" className="btn btn-light ms-2">Sign Up</Link>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="floating-icons">
          <i className="fas fa-fire floating-icon" style={{ left: '10%', animationDelay: '0s' }}></i>
          <i className="fas fa-water floating-icon" style={{ left: '25%', animationDelay: '2s' }}></i>
          <i className="fas fa-wind floating-icon" style={{ left: '40%', animationDelay: '4s' }}></i>
          <i className="fas fa-bolt floating-icon" style={{ left: '55%', animationDelay: '1s' }}></i>
          <i className="fas fa-mountain floating-icon" style={{ left: '70%', animationDelay: '3s' }}></i>
          <i className="fas fa-cloud-showers-heavy floating-icon" style={{ left: '85%', animationDelay: '5s' }}></i>
        </div>
        <div className="container text-center hero-content">
         <b><h1 className="display-3 mb-4">Real-Time Disaster Information Aggregation Software</h1></b>
          <p className="lead mb-5">Real-time tracking and alerts for natural disasters worldwide. Stay informed, stay prepared.</p>
          <Link to="/login" className="btn btn-primary btn-lg cta-button">Get Started</Link>
        </div>
      </section>

      <section className="image-section">
        <div className="container">
          <img 
            src="/Image.jpg" 
            alt="Disaster Management" 
            className="img-fluid rounded shadow-lg"
          />
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="text-center mb-5">Everything you need to stay informed</h2>
          <div className="row">
            <div className="col-md-4">
              <div className="feature-card">
                <i className="fas fa-bell feature-icon"></i>
                <h3>Real-time Alerts</h3>
                <p>Instant notifications for emergencies and natural disasters in your area.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <i className="fas fa-broadcast-tower feature-icon"></i>
                <h3>Live Updates</h3>
                <p>Continuous updates from official sources and emergency services.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <i className="fas fa-shield-alt feature-icon"></i>
                <h3>Safety Guidelines</h3>
                <p>Expert-verified safety protocols and emergency procedures.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-4 footer-section">
              <h5>Company</h5>
              <ul className="footer-links">
                <li>About</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div className="col-md-4 footer-section">
              <h5>Resources</h5>
              <ul className="footer-links">
                <li>Blog</li>
                <li>Documentation</li>
                <li>Help Center</li>
              </ul>
            </div>
            <div className="col-md-4 footer-section">
              <h5>Social</h5>
              <ul className="footer-links">
                <li><i className="fab fa-twitter me-2"></i>Twitter</li>
                <li><i className="fab fa-linkedin me-2"></i>LinkedIn</li>
                <li><i className="fab fa-facebook me-2"></i>Facebook</li>
              </ul>
            </div>
          </div>
          <hr className="mt-4 mb-4" />
          <p className="text-center mb-0">© 2025 Alert Hub. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;