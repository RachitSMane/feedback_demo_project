const express = require('express');
const router = express.Router();
const axios = require('axios');
const FAQ = require('../models/FAQ');
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

// Auto-translate FAQ to user's preferred language
router.post('/faq/:faqId', async (req, res) => {
  try {
    const { targetLanguage } = req.body;
    const faq = await FAQ.findById(req.params.faqId);
    
    if (faq.languages && faq.languages[targetLanguage]) {
      return res.json({ translation: faq.languages[targetLanguage] });
    }
    
    // Use Google Translate API
    const response = await axios.post('https://translation.googleapis.com/language/translate/v2', null, {
      params: {
        key: process.env.GOOGLE_TRANSLATE_API_KEY,
        q: faq.answer,
        target: targetLanguage
      }
    });
    
    const translatedText = response.data.data.translations[0].translatedText;
    
    // Save translation
    await FAQ.findByIdAndUpdate(
      req.params.faqId,
      { $set: { [`languages.${targetLanguage}`]: translatedText } }
    );
    
    res.json({ translation: translatedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate voice/speech for FAQ
router.post('/voice/:faqId', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.faqId);
    
    if (faq.voiceUrl) {
      return res.json({ voiceUrl: faq.voiceUrl });
    }
    
    const request = {
      input: { text: faq.answer },
      voice: { 
        languageCode: 'en-US', 
        name: 'en-US-Neural2-A'
      },
      audioConfig: { audioEncoding: 'MP3' }
    };
    
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;
    
    // Store audio (in production, upload to cloud storage)
    const voiceUrl = `/voice/${req.params.faqId}.mp3`;
    
    await FAQ.findByIdAndUpdate(
      req.params.faqId,
      { voiceUrl, voiceAvailable: true }
    );
    
    res.json({ voiceUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get supported languages
router.get('/languages', (req, res) => {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'hi': 'Hindi',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ar': 'Arabic',
    'pt': 'Portuguese',
    'ru': 'Russian'
  };
  res.json(languages);
});

module.exports = router;