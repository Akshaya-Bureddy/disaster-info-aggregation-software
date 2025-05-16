import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const AlertSettings = ({ user, settings, onUpdate }) => {
  const handleAlertChange = (e) => {
    const { name, type, checked, value } = e.target;
    onUpdate({
      alerts: {
        ...settings.alerts,
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  return (
    <section className="settings-section">
      <h2><FaExclamationTriangle /> Alert Settings</h2>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="enabled"
            checked={settings.alerts.enabled}
            onChange={handleAlertChange}
          />
          Enable Disaster Alerts
        </label>
      </div>

      {settings.alerts.enabled && (
        <div className="form-group">
          <label>State for Alerts</label>
          <input
            type="text"
            name="state"
            value={settings.alerts.state}
            onChange={handleAlertChange}
            placeholder="Enter your state"
          />
        </div>
      )}
    </section>
  );
};

export default AlertSettings;