const express = require('express');
const router = express.Router();
const Sentiment = require('sentiment');
const Ticket = require('../models/Ticket');
const FAQ = require('../models/FAQ');
const Analytics = require('../models/Analytics');
const Behavior = require('../models/Behavior');

const sentiment = new Sentiment();

// Analyze sentiment of ticket description/messages
router.post('/analyze/:ticketId', async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const ticket = await Ticket.findById(ticketId);
    
    let totalScore = 0;
    let messageCount = ticket.messages.length;
    
    // Analyze each message
    const analyzedMessages = ticket.messages.map(msg => {
      const sentimentAnalysis = sentiment.analyze(msg.message);
      totalScore += sentimentAnalysis.score;
      return {
        ...msg,
        sentimentScore: sentimentAnalysis.score,
        sentimentComparative: sentimentAnalysis.comparative
      };
    });
    
    const averageSentiment = messageCount > 0 ? totalScore / messageCount : 0;
    let sentimentLabel = 'neutral';
    
    if (averageSentiment > 0.5) sentimentLabel = 'positive';
    else if (averageSentiment < -0.5) sentimentLabel = 'negative';
    
    // Update ticket with sentiment analysis
    await Ticket.findByIdAndUpdate(ticketId, {
      sentimentAnalysis: {
        averageScore: averageSentiment,
        label: sentimentLabel,
        messages: analyzedMessages
      }
    });
    
    res.json({
      ticketId,
      averageSentimentScore: averageSentiment,
      sentimentLabel,
      messageAnalysis: analyzedMessages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze sentiment of FAQ feedback
router.post('/faq-sentiment/:faqId', async (req, res) => {
  try {
    const faqId = req.params.faqId;
    const feedback = req.body.feedback;
    
    const sentimentAnalysis = sentiment.analyze(feedback);
    
    // Store sentiment in FAQ model
    await FAQ.findByIdAndUpdate(faqId, {
      sentiment: sentimentAnalysis.score > 0 ? 'positive' : sentimentAnalysis.score < 0 ? 'negative' : 'neutral',
      sentimentScore: sentimentAnalysis.score
    });
    
    res.json({
      faqId,
      sentiment: sentimentAnalysis.score > 0 ? 'positive' : sentimentAnalysis.score < 0 ? 'negative' : 'neutral',
      sentimentScore: sentimentAnalysis.score,
      analysis: sentimentAnalysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sentiment trends
router.get('/trends/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userTickets = await Ticket.find({ userId });
    
    const sentimentTrend = userTickets.map(t => ({
      ticketId: t._id,
      createdAt: t.createdAt,
      sentiment: t.sentimentAnalysis?.label || 'neutral',
      score: t.sentimentAnalysis?.averageScore || 0
    })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Calculate trend direction
    const recentTickets = sentimentTrend.slice(-10);
    const avgRecent = recentTickets.length > 0
      ? recentTickets.reduce((sum, t) => sum + t.score, 0) / recentTickets.length
      : 0;
    
    const olderTickets = sentimentTrend.slice(0, 10);
    const avgOlder = olderTickets.length > 0
      ? olderTickets.reduce((sum, t) => sum + t.score, 0) / olderTickets.length
      : 0;
    
    const trendDirection = avgRecent > avgOlder ? 'improving' : avgRecent < avgOlder ? 'declining' : 'stable';
    
    res.json({
      userId,
      sentimentTrend,
      trendDirection,
      recentAverage: avgRecent,
      olderAverage: avgOlder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track user behavior patterns
router.post('/track-behavior/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { action, resourceId, resourceType, duration, metadata } = req.body;
    
    let behavior = await Behavior.findOne({ userId });
    
    if (!behavior) {
      behavior = new Behavior({ userId });
    }
    
    // Add action
    behavior.actions.push({
      action,
      resourceId,
      resourceType,
      duration,
      metadata,
      timestamp: new Date()
    });
    
    // Update search patterns
    if (action === 'search') {
      const keyword = metadata?.keyword;
      if (keyword) {
        behavior.searchPatterns.keywords.push(keyword);
        behavior.searchPatterns.frequency.set(
          keyword,
          (behavior.searchPatterns.frequency.get(keyword) || 0) + 1
        );
      }
    }
    
    // Update viewing patterns
    if (action === 'view') {
      behavior.viewingPatterns.mostViewedCategories.push(metadata?.category);
      if (behavior.viewingPatterns.avgTimeOnFAQ) {
        behavior.viewingPatterns.avgTimeOnFAQ = 
          (behavior.viewingPatterns.avgTimeOnFAQ + (duration || 0)) / 2;
      } else {
        behavior.viewingPatterns.avgTimeOnFAQ = duration || 0;
      }
    }
    
    behavior.updatedAt = new Date();
    await behavior.save();
    
    res.json({ message: 'Behavior tracked', behavior });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user behavior insights
router.get('/behavior-insights/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const behavior = await Behavior.findOne({ userId });
    
    if (!behavior) {
      return res.json({ insights: 'No behavior data available' });
    }
    
    // Calculate statistics
    const topSearches = Array.from(behavior.searchPatterns.frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const topCategories = Array.from(
      new Map(behavior.viewingPatterns.mostViewedCategories.map(c => [c, 1]))
    ).map(([category, count]) => ({
      category,
      count: behavior.viewingPatterns.mostViewedCategories.filter(c => c === category).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    res.json({
      userId,
      totalActions: behavior.actions.length,
      topSearches,
      topCategories,
      avgTimeOnFAQ: Math.round(behavior.viewingPatterns.avgTimeOnFAQ || 0),
      sentimentTrend: behavior.userSentiment.trend,
      preferences: behavior.preferences
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;