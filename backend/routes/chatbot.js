const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');
const Ticket = require('../models/Ticket');
const FAQ = require('../models/FAQ');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// AI Chatbot for FAQ assistance
router.post('/chat', async (req, res) => {
  try {
    const { message, ticketId, userId } = req.body;
    
    // Get context from related ticket/FAQ
    let context = '';
    if (ticketId) {
      const ticket = await Ticket.findById(ticketId);
      context = `Ticket: ${ticket.description}`;
    }
    
    const systemPrompt = `You are a helpful FAQ support assistant. Answer user questions based on the FAQ database and provide helpful solutions. Be concise and professional. ${context}`;
    
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const aiMessage = response.data.choices[0].message.content;
    
    // If in a ticket, add message to ticket
    if (ticketId) {
      await Ticket.findByIdAndUpdate(ticketId, {
        $push: {
          messages: {
            sender: null,
            message: aiMessage,
            isAI: true,
            senderRole: 'bot',
            timestamp: new Date()
          }
        }
      });
    }
    
    res.json({ message: aiMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-powered personalized FAQ suggestions
router.get('/personalized/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user behavior and preferences
    const userBehavior = await require('../models/Behavior').findOne({ userId });
    
    if (!userBehavior) {
      return res.json({ faqs: [] });
    }
    
    // Get FAQs from user's preferred categories and audience
    const personalizedFAQs = await FAQ.find({
      category: { $in: userBehavior.preferences.preferredAudience || [] },
      isPinned: true
    }).limit(10);
    
    res.json({ faqs: personalizedFAQs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate suggested FAQ response for ticket using AI
router.post('/suggest-resolution/:ticketId', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    
    // Find similar FAQs
    const similarFAQs = await FAQ.find({ 
      $text: { $search: ticket.description }
    }).limit(3);
    
    let suggestionPrompt = `Based on this support ticket: "${ticket.description}"\n\nRelated FAQs:\n`;
    similarFAQs.forEach((faq, i) => {
      suggestionPrompt += `${i + 1}. ${faq.title}: ${faq.answer}\n`;
    });
    suggestionPrompt += `\nProvide a concise resolution message.`;
    
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: suggestionPrompt }],
      temperature: 0.5,
      max_tokens: 300
    });
    
    const suggestion = response.data.choices[0].message.content;
    
    res.json({ 
      suggestion,
      relatedFAQs: similarFAQs.map(f => ({ id: f._id, title: f.title }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;