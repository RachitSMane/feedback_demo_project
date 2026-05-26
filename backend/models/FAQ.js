import mongoose from 'mongoose';

const FAQSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FAQ = mongoose.model('FAQ', FAQSchema);
export default FAQ;
