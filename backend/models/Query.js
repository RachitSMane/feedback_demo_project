import mongoose from 'mongoose';

const SolutionSchema = new mongoose.Schema({
  answer: {
    type: String,
    required: true,
    trim: true
  },
  solvedBy: {
    type: String,
    default: 'AnonymousContributor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const QuerySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'solved', 'approved'],
    default: 'pending'
  },
  solutions: [SolutionSchema],
  raisedBy: {
    type: String,
    default: 'AnonymousUser'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Query = mongoose.model('Query', QuerySchema);
export default Query;
