const mongoose = require('mongoose');

const behaviorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: String,
  actions: [
    {
      action: String, // 'search', 'view', 'vote', 'share', 'bookmark'
      resourceId: mongoose.Schema.Types.ObjectId,
      resourceType: String, // 'faq', 'ticket'
      timestamp: { type: Date, default: Date.now },
      duration: Number, // in seconds
      metadata: mongoose.Schema.Types.Mixed
    }
  ],
  searchPatterns: {
    keywords: [String],
    frequency: { type: Map, of: Number },
    unsuccessfulSearches: [String]
  },
  viewingPatterns: {
    mostViewedCategories: [String],
    avgTimeOnFAQ: Number,
    bounceRate: Number
  },
  userSentiment: {
    average: Number,
    trend: String // 'improving', 'declining', 'stable'
  },
  preferences: {
    preferredLanguage: String,
    preferredAudience: [String],
    usesVoice: { type: Boolean, default: false },
    usesOffline: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

behaviorSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Behavior', behaviorSchema);
