const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const Ticket = require('../models/Ticket');
const Analytics = require('../models/Analytics');
const axios = require('axios');

// AI Semantic Search using OpenAI embeddings
router.post('/semantic', async (req, res) => {
  try {
    const { query, userId } = req.body;
    
    // Get embedding from OpenAI
    const embeddingResponse = await axios.post('https://api.openai.com/v1/embeddings', {
      model: 'text-embedding-ada-002',
      input: query
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    
    const queryEmbedding = embeddingResponse.data.data[0].embedding;
    
    // Find similar FAQs using cosine similarity
    const faqs = await FAQ.find({ deletedAt: null });
    const scoredFAQs = faqs.map(faq => {
      const dotProduct = faq.embeddings?.reduce((sum, val, i) => sum + val * queryEmbedding[i], 0) || 0;
      const magnitude1 = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(faq.embeddings?.reduce((sum, val) => sum + val * val, 0) || 1);
      const similarity = dotProduct / (magnitude1 * magnitude2);
      return { ...faq.toObject(), similarity };
    }).filter(faq => faq.similarity > 0.7).sort((a, b) => b.similarity - a.similarity);
    
    // Log analytics
    new Analytics({
      eventType: 'search',
      userId,
      data: { query, resultCount: scoredFAQs.length }
    }).save();
    
    res.json({ results: scoredFAQs.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-suggestions based on search history
router.get('/suggestions/:userId', async (req, res) => {
  try {\n    const userId = req.params.userId;
    const analytics = await Analytics.find({ userId, eventType: 'search' }).sort('-timestamp').limit(10);
    const suggestions = [...new Set(analytics.map(a => a.data.query))];
    
    // Get trending searches
    const trendingAnalytics = await Analytics.find({ eventType: 'search' }).sort('-timestamp').limit(50);
    const trendingSearches = [...new Set(trendingAnalytics.map(a => a.data.query))];
    
    res.json({ userSuggestions: suggestions, trendingSuggestions: trendingSearches.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Smart duplicate detection
router.post('/detect-duplicates', async (req, res) => {
  try {
    const { ticketId, description } = req.body;
    
    // Find similar tickets
    const allTickets = await Ticket.find({ status: { $ne: 'closed' } });
    const similarTickets = [];
    
    allTickets.forEach(ticket => {
      const similarity = calculateSimilarity(description, ticket.description);
      if (similarity > 0.7) {
        similarTickets.push({ ...ticket.toObject(), similarity });
      }
    });
    
    res.json({ duplicates: similarTickets.sort((a, b) => b.similarity - a.similarity) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function for string similarity (Levenshtein)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

module.exports = router;