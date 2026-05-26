import FAQ from '../models/FAQ.js';
import { localDbHelper } from '../config/localDbHelper.js';

// @desc    Get all FAQs
// @route   GET /api/faqs
// @access  Public
export const getFAQs = async (req, res) => {
  try {
    if (global.useLocalDB) {
      const faqs = await localDbHelper.getFAQs();
      return res.status(200).json(faqs);
    }

    const faqs = await FAQ.find({}).sort({ createdAt: -1 });
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving FAQs', error: error.message });
  }
};

// @desc    Create an FAQ directly (Admin)
// @route   POST /api/faqs
// @access  Private (Simulated admin role check on client)
export const createFAQ = async (req, res) => {
  const { question, answer, category } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: 'Please provide both question and answer' });
  }

  try {
    if (global.useLocalDB) {
      const newFaq = await localDbHelper.createFAQ({ question, answer, category });
      return res.status(201).json(newFaq);
    }

    const newFaq = await FAQ.create({ question, answer, category: category || 'General' });
    res.status(201).json(newFaq);
  } catch (error) {
    res.status(500).json({ message: 'Error creating FAQ', error: error.message });
  }
};
