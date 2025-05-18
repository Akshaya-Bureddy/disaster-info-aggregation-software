import ExternalData from '../models/ExternalData.js';
import { io } from '../server.js';
import User from '../models/User.js';

const checkAndSendAlerts = async () => {
  try {
    const users = await User.find({ 'settings.alerts.enabled': true });

    // Filter alerts to only include those with India in the address
    const activeAlerts = await ExternalData.find({
      isActive: true,
      'location.address': { $regex: /India/i }  // Case-insensitive search for "India"
    });
    
    // Process alerts for each user
    users.forEach(async (user) => {
      if (!user.address?.state) return;

      // Get alerts for user's state
      const nearbyAlerts = activeAlerts.filter(alert => {
        const alertLocation = alert.location.address?.toLowerCase() || '';
        const userState = user.address.state.toLowerCase();
        return alertLocation.includes(userState);
      });

      if (nearbyAlerts.length > 0) {
        const channelName = `alerts:India:${user.address.state}`.toLowerCase();
        io.emit(channelName, nearbyAlerts.map(alert => ({
          id: alert._id,
          type: alert.type,
          location: {
            country: 'India',
            state: user.address.state,
            city: user.address.city || '',
            area: alert.location.address || ''
          },
          severity: alert.severity,
          description: alert.description || alert.content,
          source: alert.source,
          createdAt: alert.timestamp || alert.createdAt
        })));
      }
    });
  } catch (error) {
    console.error('Error in alert checker:', error);
  }
};

export const startAlertChecker = () => {
  const INTERVAL = 5 * 60 * 1000;
  checkAndSendAlerts();
  setInterval(checkAndSendAlerts, INTERVAL);
  console.log('Alert checker started - Monitoring Indian disasters only');
};