import Report from '../models/Report.js';
import SocialMediaPost from '../models/SocialMediaPost.js';
import RescueTeam from '../models/RescueTeam.js';

export const getAnalytics = async (req, res) => {
  try {
    // Get disaster statistics
    const disasterStats = await Report.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAffected: { $sum: '$peopleAffected.total' },
          rescued: { $sum: '$peopleAffected.rescued' },
          deceased: { $sum: '$peopleAffected.deceased' },
          injured: { $sum: '$peopleAffected.injured' },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    // Get severity distribution
    const severityStats = await Report.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get rescue team performance
    const rescueTeamStats = await RescueTeam.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime.average' }
        }
      }
    ]);

    // Get social media impact
    const socialMediaStats = await SocialMediaPost.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          verifiedPosts: {
            $sum: { $cond: ['$verified', 1, 0] }
          }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Report.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      disasterStats,
      severityStats,
      rescueTeamStats,
      socialMediaStats,
      monthlyTrends
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
};