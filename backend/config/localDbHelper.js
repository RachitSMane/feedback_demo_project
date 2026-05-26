import fs from 'fs';

const readData = () => {
  try {
    const data = fs.readFileSync(global.localDbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local JSON database:', error);
    return { faqs: [], queries: [] };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(global.localDbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local JSON database:', error);
  }
};

export const localDbHelper = {
  // FAQs operations
  getFAQs: async () => {
    const db = readData();
    return db.faqs;
  },

  createFAQ: async (faqData) => {
    const db = readData();
    const newFaq = {
      id: `faq-${Date.now()}`,
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category || 'General',
      createdAt: new Date().toISOString()
    };
    db.faqs.push(newFaq);
    writeData(db);
    return newFaq;
  },

  // Queries operations
  getQueries: async () => {
    const db = readData();
    return db.queries;
  },

  createQuery: async (queryData) => {
    const db = readData();
    const newQuery = {
      id: `query-${Date.now()}`,
      question: queryData.question,
      description: queryData.description || '',
      category: queryData.category || 'General',
      status: 'pending',
      solutions: [],
      raisedBy: queryData.raisedBy || 'AnonymousUser',
      createdAt: new Date().toISOString()
    };
    db.queries.push(newQuery);
    writeData(db);
    return newQuery;
  },

  addSolution: async (queryId, solutionData) => {
    const db = readData();
    const queryIndex = db.queries.findIndex(q => q.id === queryId);
    if (queryIndex === -1) return null;

    const newSolution = {
      id: `sol-${Date.now()}`,
      answer: solutionData.answer,
      solvedBy: solutionData.solvedBy || 'AnonymousContributor',
      createdAt: new Date().toISOString()
    };

    db.queries[queryIndex].solutions.push(newSolution);
    db.queries[queryIndex].status = 'solved';
    writeData(db);
    return db.queries[queryIndex];
  },

  approveQuery: async (queryId, overrideData) => {
    const db = readData();
    const queryIndex = db.queries.findIndex(q => q.id === queryId);
    if (queryIndex === -1) return null;

    const query = db.queries[queryIndex];
    
    // Choose the answer: either the admin's override answer or the first solution's answer
    const finalAnswer = overrideData.answer || (query.solutions.length > 0 ? query.solutions[0].answer : '');

    // 1. Add to FAQs
    const newFaq = {
      id: `faq-${Date.now()}`,
      question: query.question,
      answer: finalAnswer,
      category: query.category,
      createdAt: new Date().toISOString()
    };
    db.faqs.push(newFaq);

    // 2. Remove query or mark as approved
    query.status = 'approved';
    // Remove query from list to keep dashboard clean, or keep it. Let's delete it so dashboard only has pending/solved
    db.queries.splice(queryIndex, 1);

    writeData(db);
    return { query, faq: newFaq };
  },

  deleteQuery: async (queryId) => {
    const db = readData();
    const queryIndex = db.queries.findIndex(q => q.id === queryId);
    if (queryIndex === -1) return false;
    db.queries.splice(queryIndex, 1);
    writeData(db);
    return true;
  }
};
