const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  faqId: mongoose.Schema.Types.ObjectId,
  ticketId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  eventType: { type: String, enum: ['view', 'vote', 'search', 'resolution', 'ticket_creation', 'feedback'] },
  data: mongoose.Schema.Types.Mixed,
  sessionId: String,
  timestamp: { type: Date, default: Date.now },
  userAgent: String,
  ipAddress: String,
  deviceType: String,
  resolution: String,
  resolutionTime: Number,
  satisfactionScore: Number
});

analyticsSchema.index({ date: -1, eventType: 1 });
analyticsSchema.index({ faqId: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
