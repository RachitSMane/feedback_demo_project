import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

global.useLocalDB = false;
global.localDbPath = path.resolve('local_db.json');

// Helper to initialize local JSON file database if fallback is active
const initLocalDB = () => {
  if (!fs.existsSync(global.localDbPath)) {
    const initialData = {
      faqs: [
        {
          id: "faq-1",
          question: "What is the FAQ Platform?",
          answer: "It is a premium MERN stack portal where users can read FAQs, raise new queries if their questions are unanswered, and solve queries raised by other users. Contributors can propose answers, which are then vetted and approved by admins before going live.",
          category: "General",
          createdAt: new Date().toISOString()
        },
        {
          id: "faq-2",
          question: "How do I raise a new query?",
          answer: "Navigate to the 'Raise Query' tab, fill in the question title, category, and an optional detailed description, and submit. It will immediately appear in the 'Solve Queries' tab for other community members or admins to answer.",
          category: "Usage",
          createdAt: new Date().toISOString()
        },
        {
          id: "faq-3",
          question: "Can anyone solve a raised query?",
          answer: "Yes! Any registered user or contributor can view open queries, write a solution, and submit it. Once a solution is submitted by a user, it goes to the Admin Review queue. Once an administrator approves it, it gets added directly to this FAQ page.",
          category: "Usage",
          createdAt: new Date().toISOString()
        }
      ],
      queries: [
        {
          id: "query-1",
          question: "Can I edit an FAQ after it has been approved?",
          description: "I noticed a typo in one of the approved FAQs. Is there an edit feature for contributors or admins?",
          category: "Technical",
          status: "pending",
          solutions: [],
          raisedBy: "AnonymousUser",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "query-2",
          question: "What web frameworks are supported in this platform?",
          description: "Does the frontend use React, and can I add custom styles?",
          category: "Technical",
          status: "solved",
          solutions: [
            {
              id: "sol-1",
              answer: "The platform is built strictly on React with a customized premium Vanilla CSS glassmorphic theme. No Tailwind CSS or external component libraries are used, providing absolute design fidelity.",
              solvedBy: "SuperCoder",
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          raisedBy: "WebDevEnthusiast",
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
        }
      ]
    };
    fs.writeFileSync(global.localDbPath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('\n⚠️  No MONGODB_URI environment variable detected in .env file!');
    console.warn('⚡ Activating Zero-Config local JSON database failover...');
    global.useLocalDB = true;
    initLocalDB();
    console.log(`📂 Local JSON Database active at: ${global.localDbPath}\n`);
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout to failover rapidly
    });
    console.log(`\n✅ MongoDB Connected Successfully: ${conn.connection.host}\n`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);
    console.warn('⚡ Falling back to zero-config local JSON database...');
    global.useLocalDB = true;
    initLocalDB();
    console.log(`📂 Local JSON Database active at: ${global.localDbPath}\n`);
  }
};

export default connectDB;
