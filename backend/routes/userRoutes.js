import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Disaster from '../models/Disaster.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Get user's disasters and count
      const userDisasters = await Disaster.find({ user: user._id });
      const reportsCount = userDisasters.length;

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        photoUrl: user.photoUrl,
        role: user.role,
        reportsCount,
        disasters: userDisasters
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.phone = req.body.phone || user.phone;
      user.address = {
        houseNo: req.body.address?.houseNo || user.address?.houseNo,
        street: req.body.address?.street || user.address?.street,
        city: req.body.address?.city || user.address?.city,
        state: req.body.address?.state || user.address?.state,
        pincode: req.body.address?.pincode || user.address?.pincode
      };
      user.photoUrl = req.body.photoUrl || user.photoUrl;

      const updatedUser = await user.save();
      const userDisasters = await Disaster.find({ user: user._id });

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        photoUrl: updatedUser.photoUrl,
        role: updatedUser.role,
        disasters: userDisasters
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user's disasters
router.get('/disasters', protect, async (req, res) => {
  try {
    const disasters = await Disaster.find({ user: req.user._id });
    res.json(disasters);
  } catch (error) {
    console.error('Fetch disasters error:', error);
    res.status(500).json({ message: 'Error fetching disasters' });
  }
});

// Delete disaster report
router.delete('/disasters/:id', protect, async (req, res) => {
  try {
    const disaster = await Disaster.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!disaster) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await disaster.deleteOne();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete disaster error:', error);
    res.status(500).json({ message: 'Error deleting report' });
  }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

export default router;