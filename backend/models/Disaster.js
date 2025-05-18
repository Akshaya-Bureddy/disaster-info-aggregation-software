import mongoose from 'mongoose';

const disasterSchema = new mongoose.Schema({
  type: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: { type: String, required: true },
  peopleAffected: { type: Number, default: 0 },
  infrastructure: { type: String, default: '' },
  images: [String],
  videos: [String],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['reported', 'verified', 'resolved', 'false_alarm'], default: 'reported' },
  source: { type: String, default: 'user_report' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

disasterSchema.index({ location: '2dsphere' });

const Disaster = mongoose.model('Disaster', disasterSchema);
export default Disaster;