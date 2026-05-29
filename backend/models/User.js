const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'support'], default: 'user' },
  avatar: String,
  language: { type: String, default: 'en' },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
    voiceEnabled: { type: Boolean, default: false }
  },
  behavior: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    searchHistory: [{ query: String, timestamp: Date }],
    viewedFAQs: [{ faqId: mongoose.Schema.Types.ObjectId, timestamp: Date }],
    ratings: [{ faqId: mongoose.Schema.Types.ObjectId, rating: Number }]
  },
  emergencyMode: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  verificationToken: String,
  resetToken: String,
  resetTokenExpire: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
