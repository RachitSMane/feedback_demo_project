import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const API_BASE = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const [role, setRole] = useState('visitor'); // 'visitor' | 'contributor' | 'admin'
  const [faqs, setFaqs] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch FAQs from API
  const fetchFAQs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await fetch(`${API_BASE}/faqs`);
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      const data = await res.json();
      setFaqs(data);
    } catch (err) {
      console.error(err);
      addToast('Could not load FAQs. Make sure backend is running.', 'danger');
    } finally {
      setLoadingFaqs(false);
    }
  };

  // Fetch queries from API
  const fetchQueries = async () => {
    setLoadingQueries(true);
    try {
      const res = await fetch(`${API_BASE}/queries`);
      if (!res.ok) throw new Error('Failed to fetch queries');
      const data = await res.json();
      setQueries(data);
    } catch (err) {
      console.error(err);
      // Quietly log this to avoid annoying toasts when visitor just lands
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
    fetchQueries();
  }, []);

  // Action: Raise a new query
  const raiseQuery = async (queryData) => {
    try {
      const res = await fetch(`${API_BASE}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryData)
      });
      
      if (!res.ok) throw new Error('Failed to raise query');
      
      const newQuery = await res.json();
      setQueries((prev) => [newQuery, ...prev]);
      addToast('Query raised successfully! Others can now view and solve it.', 'success');
      return true;
    } catch (err) {
      console.error(err);
      addToast('Error raising query. Try again.', 'danger');
      return false;
    }
  };

  // Action: Submit a solution (Contributor)
  const solveQuery = async (queryId, solutionData) => {
    try {
      const res = await fetch(`${API_BASE}/queries/${queryId}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solutionData)
      });

      if (!res.ok) throw new Error('Failed to submit solution');

      const updatedQuery = await res.json();
      setQueries((prev) => 
        prev.map((q) => (q.id === queryId || q._id === queryId ? updatedQuery : q))
      );
      addToast('Solution submitted! It has been sent to Admin for review.', 'success');
      return true;
    } catch (err) {
      console.error(err);
      addToast('Error submitting solution.', 'danger');
      return false;
    }
  };

  // Action: Approve query & add to FAQ (Admin)
  const approveQuery = async (queryId, overrideData) => {
    try {
      const res = await fetch(`${API_BASE}/queries/${queryId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      });

      if (!res.ok) throw new Error('Failed to approve query');

      const result = await res.json();
      
      // Update FAQs list
      setFaqs((prev) => [result.faq, ...prev]);
      
      // Remove or update Query in the queries list
      setQueries((prev) => 
        prev.filter((q) => q.id !== queryId && q._id !== queryId)
      );
      
      addToast('Query approved and promoted to FAQ section!', 'success');
      return true;
    } catch (err) {
      console.error(err);
      addToast('Error approving query.', 'danger');
      return false;
    }
  };

  // Action: Delete query (Admin)
  const deleteQuery = async (queryId) => {
    try {
      const res = await fetch(`${API_BASE}/queries/${queryId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete query');

      setQueries((prev) => 
        prev.filter((q) => q.id !== queryId && q._id !== queryId)
      );
      addToast('Query deleted successfully.', 'warning');
      return true;
    } catch (err) {
      console.error(err);
      addToast('Error deleting query.', 'danger');
      return false;
    }
  };

  // Action: Add FAQ directly (Admin)
  const addFAQDirectly = async (faqData) => {
    try {
      const res = await fetch(`${API_BASE}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqData)
      });

      if (!res.ok) throw new Error('Failed to create FAQ');

      const newFaq = await res.json();
      setFaqs((prev) => [newFaq, ...prev]);
      addToast('FAQ created successfully!', 'success');
      return true;
    } catch (err) {
      console.error(err);
      addToast('Error creating FAQ.', 'danger');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      faqs,
      queries,
      loadingFaqs,
      loadingQueries,
      toasts,
      addToast,
      removeToast,
      raiseQuery,
      solveQuery,
      approveQuery,
      deleteQuery,
      addFAQDirectly,
      refreshData: () => { fetchFAQs(); fetchQueries(); }
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
