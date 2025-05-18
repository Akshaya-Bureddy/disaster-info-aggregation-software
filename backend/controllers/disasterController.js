import Disaster from '../models/Disaster.js';
import { io } from '../server.js';
//new
import multer from 'multer';
import path from 'path';
//new

export const createDisaster = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    console.log('Files:', req.files);
    console.log('User:', req.user);

    const {
      type,
      severity,
      description,
      peopleAffected,
      infrastructure,
      location
    } = req.body;

    const disasterData = {
      type,
      location: JSON.parse(location),
      severity,
      description,
      peopleAffected: parseInt(peopleAffected),
      infrastructure,
      reportedBy: req.user._id,
      images: req.files?.images?.map(file => file.filename) || [],
      videos: req.files?.videos?.map(file => file.filename) || []
    };

    console.log('Data to be saved:', disasterData);

    const disaster = await Disaster.create(disasterData);
    console.log('Saved disaster:', disaster);

    // Transform the response to include full URLs
    const responseData = {
      ...disaster.toObject(),
      images: disaster.images.map(image => `/uploads/${image}`),
      videos: disaster.videos.map(video => `/uploads/${video}`)
    };

    res.status(201).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error creating disaster:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit report'
    });
  }
};



export const getDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find()
      .populate('reportedBy', 'username email')
      .sort({ createdAt: -1 });

    const transformedDisasters = disasters.map(disaster => {
      const disasterObj = disaster.toObject();
      return {
        ...disasterObj,
        images: disasterObj.images.map(image => `/uploads/${image}`),
        videos: disasterObj.videos.map(video => `/uploads/${video}`)
      };
    });

    res.json(transformedDisasters);
  } catch (error) {
    console.error('Error fetching disasters:', error);
    res.status(500).json({ message: error.message });
  }
};
export const getActiveDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find({
      status: { $in: ['reported', 'verified'] }
    })
      .select('type location severity description status createdAt')
      .sort({ createdAt: -1 });
    
    res.json(disasters);
  } catch (error) {
    console.error('Error fetching active disasters:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getRecentAlerts = async (req, res) => {
  try {
    const alerts = await Disaster.find()
      .select('type location severity description status createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Emit real-time alerts
    io.emit('recentAlerts', alerts);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMapMarkers = async (req, res) => {
  try {
    const markers = await Disaster.find({
      status: { $ne: 'false_alarm' }
    })
      .select('type location severity description status createdAt')
      .sort({ createdAt: -1 });
    
    res.json(markers);
  } catch (error) {
    console.error('Error fetching map markers:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getNearbyDisasters = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10000 } = req.query;

    const disasters = await Disaster.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .populate('reportedBy', 'username email')
    .sort({ createdAt: -1 });

    res.json(disasters);
  } catch (error) {
    console.error('Error fetching nearby disasters:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getDisasterById = async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id)
      .populate('reportedBy', 'username email');
    
    if (!disaster) {
      return res.status(404).json({ message: 'Disaster not found' });
    }
    
    res.json(disaster);
  } catch (error) {
    console.error('Error fetching disaster:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'username email');

    if (!disaster) {
      return res.status(404).json({ message: 'Disaster not found' });
    }

    io.emit('disasterUpdated', disaster);
    res.json(disaster);
  } catch (error) {
    console.error('Error updating disaster:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateDisasterStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['reported', 'verified', 'resolved', 'false_alarm'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: reported, verified, resolved, false_alarm' 
      });
    }

    const disaster = await Disaster.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'username email');

    if (!disaster) {
      return res.status(404).json({ message: 'Disaster not found' });
    }

    io.emit('disasterStatusUpdated', disaster);
    res.json(disaster);
  } catch (error) {
    console.error('Error updating disaster status:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findByIdAndDelete(req.params.id);
    
    if (!disaster) {
      return res.status(404).json({ message: 'Disaster not found' });
    }

    io.emit('disasterDeleted', req.params.id);
    res.json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    console.error('Error deleting disaster:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getUserDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find({ reportedBy: req.user._id })
      .populate('reportedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(disasters);
  } catch (error) {
    console.error('Error fetching user disasters:', error);
    res.status(500).json({ message: error.message });
  }
};