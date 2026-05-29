const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Ticket = require('../models/Ticket');
const FAQ = require('../models/FAQ');

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Total views
    const totalViews = await Analytics.countDocuments({ ...filter, eventType: 'view' });
    
    // Total searches
    const totalSearches = await Analytics.countDocuments({ ...filter, eventType: 'search' });
    
    // Total tickets created
    const totalTickets = await Analytics.countDocuments({ ...filter, eventType: 'ticket_creation' });
    
    // Resolution time average
    const ticketsWithResolution = await Ticket.find({ resolutionTime: { $exists: true } });
    const avgResolutionTime = ticketsWithResolution.length > 0
      ? ticketsWithResolution.reduce((sum, t) => sum + t.resolutionTime, 0) / ticketsWithResolution.length
      : 0;
    
    // Most viewed FAQs
    const mostViewed = await Analytics.aggregate([
      { $match: { ...filter, eventType: 'view' } },
      { $group: { _id: '$faqId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Most voted FAQs
    const mostVoted = await FAQ.find().sort({ helpful: -1 }).limit(10);
    
    res.json({
      totalViews,
      totalSearches,
      totalTickets,
      avgResolutionTime: Math.round(avgResolutionTime),
      mostViewedFAQs: mostViewed,
      mostVotedFAQs: mostVoted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track resolution progress
router.post('/track-progress', async (req, res) => {
  try {
    const { ticketId, progressPercentage, status, resolutionTime } = req.body;
    
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        progressPercentage,
        status,
        ...(status === 'resolved' && { resolutionTime })
      },
      { new: true }
    );
    
    // Log analytics
    new Analytics({
      ticketId,
      eventType: 'resolution',
      data: { progressPercentage, status, resolutionTime }
    }).save();
    
    res.json({ message: 'Progress tracked', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user engagement metrics
router.get('/engagement/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const userAnalytics = await Analytics.find({ userId });
    const viewCount = userAnalytics.filter(a => a.eventType === 'view').length;
    const searchCount = userAnalytics.filter(a => a.eventType === 'search').length;
    const voteCount = userAnalytics.filter(a => a.eventType === 'vote').length;
    const ticketCount = userAnalytics.filter(a => a.eventType === 'ticket_creation').length;
    
    const engagementScore = (viewCount * 1) + (searchCount * 2) + (voteCount * 3) + (ticketCount * 4);
    
    res.json({
      userId,
      metrics: {
        views: viewCount,
        searches: searchCount,
        votes: voteCount,
        tickets: ticketCount,
        engagementScore
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get FAQ performance metrics
router.get('/faq-performance/:faqId', async (req, res) => {
  try {
    const faqId = req.params.faqId;
    const faq = await FAQ.findById(faqId);
    
    const views = await Analytics.countDocuments({ faqId, eventType: 'view' });
    const votes = faq.votes.length;
    const upVotes = faq.votes.filter(v => v.vote === 'up').length;
    const downVotes = faq.votes.filter(v => v.vote === 'down').length;
    
    const helpfulPercentage = votes > 0 ? Math.round((upVotes / votes) * 100) : 0;
    
    res.json({
      faqId,
      title: faq.title,
      views,
      totalVotes: votes,
      upVotes,
      downVotes,
      helpfulPercentage,
      averageRating: faq.averageRating
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time-series analytics
router.get('/time-series', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const timeSeries = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    res.json({ timeSeries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export analytics
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const analytics = await Analytics.find().limit(1000);
    
    if (format === 'csv') {
      let csv = 'Timestamp,Event Type,FAQ ID,Ticket ID,User ID,Data\n';
      analytics.forEach(a => {
        csv += `${a.timestamp},${a.eventType},${a.faqId},${a.ticketId},${a.userId},"${JSON.stringify(a.data)}"\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.send(csv);
    } else if (format === 'json') {
      res.json(analytics);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;