import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import faqRoutes from './routes/faqRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

// Configure Environment Variables
dotenv.config();

// Establish Database Connection
await connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Base Endpoints
app.use('/api/faqs', faqRoutes);
app.use('/api/queries', queryRoutes);

// Root Ping Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: global.useLocalDB ? 'Local JSON DB Failover' : 'MongoDB (Mongoose)',
    timestamp: new Date()
  });
});

// Port Selection
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server successfully launched on port ${PORT}`);
  console.log(`📈 Health endpoint active at http://localhost:${PORT}/api/health`);
  console.log(`📚 FAQs active at http://localhost:${PORT}/api/faqs`);
  console.log(`💬 Queries active at http://localhost:${PORT}/api/queries`);
});
