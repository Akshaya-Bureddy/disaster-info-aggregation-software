import mongoose from 'mongoose';

const rescueTeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contact: {
    phone: String,
    email: String,
    emergencyNumber: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  specialization: [{
    type: String,
    enum: ['medical', 'fire', 'search', 'water', 'technical']
  }],
  capacity: {
    total: Number,
    available: Number
  },
  status: {
    type: String,
    enum: ['active', 'standby', 'on-mission'],
    default: 'standby'
  },
  currentMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  responseTime: {
    average: Number,
    lastResponse: Number
  }
}, {
  timestamps: true
});

rescueTeamSchema.index({ location: '2dsphere' });
rescueTeamSchema.index({ status: 1 });
rescueTeamSchema.index({ specialization: 1 });

const RescueTeam = mongoose.model('RescueTeam', rescueTeamSchema);

export default RescueTeam;