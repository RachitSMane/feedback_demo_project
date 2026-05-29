const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  answer: { type: String, required: true },
  category: { type: String, required: true },
  tags: [String],
  audience: [{ type: String }], // e.g., ['students', 'faculty', 'admin']
  priority: { type: Number, default: 0 }, // Higher = more important
  isPinned: { type: Boolean, default: false },
  embeddings: [Number], // For semantic search
  views: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  votes: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      vote: { type: String, enum: ['up', 'down'] },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  ratings: [{ userId: mongoose.Schema.Types.ObjectId, rating: Number }],
  averageRating: { type: Number, default: 0 },
  screenshots: [
    {
      url: String,
      description: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  relatedFAQs: [mongoose.Schema.Types.ObjectId],
  duplicateOf: mongoose.Schema.Types.ObjectId,
  isDuplicate: { type: Boolean, default: false },
  author: mongoose.Schema.Types.ObjectId,
  lastModifiedBy: mongoose.Schema.Types.ObjectId,
  languages: { type: Map, of: String }, // Translated versions
  offlineAvailable: { type: Boolean, default: true },
  sentiment: { type: String, default: 'neutral' }, // neutral, positive, negative
  sentimentScore: { type: Number, default: 0 },
  voiceAvailable: { type: Boolean, default: false },
  voiceUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: Date
});

// Index for semantic search and filtering
faqSchema.index({ category: 1, audience: 1, isPinned: -1, priority: -1 });
faqSchema.index({ title: 'text', answer: 'text', tags: 'text' });

module.exports = mongoose.model('FAQ', faqSchema);
