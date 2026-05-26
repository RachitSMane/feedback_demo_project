import express from 'express';
import { getFAQs, createFAQ } from '../controllers/faqController.js';

const router = express.Router();

router.route('/')
  .get(getFAQs)
  .post(createFAQ);

export default router;
