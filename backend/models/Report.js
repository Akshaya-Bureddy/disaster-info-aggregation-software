import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'tsunami', 'tornado', 'landslide', 'other']
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
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  description: {
    type: String,
    required: true
  },
  peopleAffected: {
    total: Number,
    rescued: Number,
    missing: Number
  },
  infrastructure: String,
  images: [String],
  videos: [String],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'monitoring'],
    default: 'active'
  },
  socialMediaPosts: [{
    platform: String,
    content: String,
    url: String,
    timestamp: Date
  }],
  rescueTeams: [{
    name: String,
    contact: String,
    status: String,
    membersCount: Number
  }]
}, {
  timestamps: true
});

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ type: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;