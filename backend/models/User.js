import mongoose from 'mongoose';
import axios from 'axios';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    houseNo: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  photoUrl: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  reportsSubmitted: {
    type: Number,
    default: 0
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      frequency: { type: String, default: 'realtime' }
    },
    alerts: {
      enabled: { type: Boolean, default: true },
      state: { type: String, required: false },
      lastChecked: { type: Date, default: Date.now }
    }
  },
  createdAt: {
    
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('address')) {
    try {
      const address = `${this.address.houseNo} ${this.address.street} ${this.address.city} ${this.address.state} ${this.address.pincode}`;
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        this.address.coordinates = [lng, lat];
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;