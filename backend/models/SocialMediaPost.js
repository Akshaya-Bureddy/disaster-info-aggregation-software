import mongoose from 'mongoose';

const socialMediaPostSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['twitter', 'facebook', 'instagram', 'news']
  },
  content: {
    type: String,
    required: true
  },
  author: String,
  url: String,
  imageUrl: String,
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
  disasterType: {
    type: String,
    required: true,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'tsunami', 'tornado', 'landslide', 'other']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

socialMediaPostSchema.index({ location: '2dsphere' });
socialMediaPostSchema.index({ timestamp: -1 });
socialMediaPostSchema.index({ disasterType: 1 });

const SocialMediaPost = mongoose.model('SocialMediaPost', socialMediaPostSchema);

export default SocialMediaPost;