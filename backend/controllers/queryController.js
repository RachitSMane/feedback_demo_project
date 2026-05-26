import Query from '../models/Query.js';
import FAQ from '../models/FAQ.js';
import { localDbHelper } from '../config/localDbHelper.js';

// @desc    Get all active queries
// @route   GET /api/queries
// @access  Public
export const getQueries = async (req, res) => {
  try {
    if (global.useLocalDB) {
      const queries = await localDbHelper.getQueries();
      return res.status(200).json(queries);
    }

    const queries = await Query.find({ status: { $ne: 'approved' } }).sort({ createdAt: -1 });
    res.status(200).json(queries);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving queries', error: error.message });
  }
};

// @desc    Raise a new query
// @route   POST /api/queries
// @access  Public
export const createQuery = async (req, res) => {
  const { question, description, category, raisedBy } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Please provide a question' });
  }

  try {
    if (global.useLocalDB) {
      const newQuery = await localDbHelper.createQuery({ question, description, category, raisedBy });
      return res.status(201).json(newQuery);
    }

    const newQuery = await Query.create({
      question,
      description: description || '',
      category: category || 'General',
      raisedBy: raisedBy || 'AnonymousUser',
      status: 'pending',
      solutions: []
    });
    res.status(201).json(newQuery);
  } catch (error) {
    res.status(500).json({ message: 'Error raising query', error: error.message });
  }
};

// @desc    Submit a solution to an open query
// @route   POST /api/queries/:id/solve
// @access  Public (Contributor)
export const solveQuery = async (req, res) => {
  const { id } = req.params;
  const { answer, solvedBy } = req.body;

  if (!answer) {
    return res.status(400).json({ message: 'Please provide a solution/answer' });
  }

  try {
    if (global.useLocalDB) {
      const updatedQuery = await localDbHelper.addSolution(id, { answer, solvedBy });
      if (!updatedQuery) {
        return res.status(404).json({ message: 'Query not found' });
      }
      return res.status(200).json(updatedQuery);
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Add solution and transition status
    query.solutions.push({
      answer,
      solvedBy: solvedBy || 'AnonymousContributor',
      createdAt: new Date()
    });
    query.status = 'solved';
    await query.save();

    res.status(200).json(query);
  } catch (error) {
    res.status(500).json({ message: 'Error saving solution', error: error.message });
  }
};

// @desc    Approve a query and promote it to FAQ (Admin)
// @route   PUT /api/queries/:id/approve
// @access  Private (Admin)
export const approveQuery = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body; // In case admin overrides/edits the solution

  try {
    if (global.useLocalDB) {
      const result = await localDbHelper.approveQuery(id, { answer });
      if (!result) {
        return res.status(404).json({ message: 'Query not found' });
      }
      return res.status(200).json({
        message: 'Query approved and promoted to FAQ successfully',
        faq: result.faq,
        query: result.query
      });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Find the final answer text
    const finalAnswer = answer || (query.solutions.length > 0 ? query.solutions[0].answer : '');
    if (!finalAnswer) {
      return res.status(400).json({ message: 'Cannot approve a query without an answer/solution' });
    }

    // 1. Create FAQ entry
    const newFaq = await FAQ.create({
      question: query.question,
      answer: finalAnswer,
      category: query.category
    });

    // 2. Mark query as approved or delete it from the queue
    query.status = 'approved';
    await query.save();
    // Alternately, delete the query to keep queries dashboard clean
    await Query.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Query approved and promoted to FAQ successfully',
      faq: newFaq,
      query
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving query', error: error.message });
  }
};

// @desc    Delete a query (Admin)
// @route   DELETE /api/queries/:id
// @access  Private (Admin)
export const deleteQuery = async (req, res) => {
  const { id } = req.params;

  try {
    if (global.useLocalDB) {
      const deleted = await localDbHelper.deleteQuery(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Query not found' });
      }
      return res.status(200).json({ message: 'Query deleted successfully' });
    }

    const query = await Query.findByIdAndDelete(id);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.status(200).json({ message: 'Query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting query', error: error.message });
  }
};
