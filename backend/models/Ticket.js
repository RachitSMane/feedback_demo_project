const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, default: uuidv4, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: mongoose.Schema.Types.ObjectId,
  screenshots: [{ url: String, uploadedAt: Date }],
  messages: [
    {
      sender: mongoose.Schema.Types.ObjectId,
      senderRole: String,
      message: String,
      attachments: [String],
      timestamp: { type: Date, default: Date.now },
      isAI: { type: Boolean, default: false }
    }
  ],
  resolution: String,
  resolutionTime: Number, // in minutes
  feedback: { rating: Number, comment: String },
  isDuplicate: { type: Boolean, default: false },
  duplicateOf: mongoose.Schema.Types.ObjectId,
  suggestedFAQs: [mongoose.Schema.Types.ObjectId],
  emergencyMode: { type: Boolean, default: false },
  emergencyContact: { phone: String, email: String },
  progressPercentage: { type: Number, default: 0 },
  relatedTickets: [mongoose.Schema.Types.ObjectId],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  closedAt: Date
});

ticketSchema.index({ userId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ emergencyMode: 1, priority: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
