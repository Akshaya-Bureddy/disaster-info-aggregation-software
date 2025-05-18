import Report from '../models/Report.js';
import { io } from '../server.js';

export const createReport = async (req, res) => {
  try {
    const report = await Report.create({
      ...req.body,
      reportedBy: req.user._id
    });

    await report.populate('reportedBy', 'firstName lastName');
    io.emit('newReport', report);

    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { 
      sort = '-createdAt',
      type,
      severity,
      startDate,
      endDate,
      limit = 10,
      page = 1
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const reports = await Report.find(query)
      .populate('reportedBy', 'firstName lastName')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const disasterStats = await Report.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAffected: { $sum: '$peopleAffected.total' },
          totalRescued: { $sum: '$peopleAffected.rescued' },
          avgSeverity: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'low'] }, then: 1 },
                  { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$severity', 'critical'] }, then: 4 }
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);

    res.json(disasterStats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getRescueTeams = async (req, res) => {
  try {
    const teams = await Report.aggregate([
      { $unwind: '$rescueTeams' },
      {
        $group: {
          _id: '$rescueTeams.name',
          status: { $first: '$rescueTeams.status' },
          contact: { $first: '$rescueTeams.contact' },
          membersCount: { $first: '$rescueTeams.membersCount' },
          activeDisasters: { $sum: 1 }
        }
      }
    ]);

    res.json(teams);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};