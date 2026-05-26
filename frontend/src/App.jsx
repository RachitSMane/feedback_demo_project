import React, { useState } from 'react';
import { useApp, AppProvider } from './context/AppContext';
import FAQCard from './components/FAQCard';
import QueryCard from './components/QueryCard';
import { 
  Search, 
  HelpCircle, 
  PlusCircle, 
  MessageSquare, 
  ShieldAlert,
  User, 
  BookOpen, 
  Plus, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const MainAppContent = () => {
  const { 
    role, 
    setRole, 
    faqs, 
    queries, 
    loadingFaqs, 
    loadingQueries, 
    toasts, 
    removeToast,
    raiseQuery,
    addFAQDirectly,
    refreshData 
  } = useApp();

  // Navigation tab state: 'faqs' | 'raise' | 'dashboard'
  const [activeTab, setActiveTab] = useState('faqs');
  
  // Search and Category filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Form states - Raise Query
  const [queryForm, setQueryForm] = useState({
    question: '',
    description: '',
    category: 'General',
    raisedBy: ''
  });

  // Form states - Direct Admin FAQ
  const [adminFaqForm, setAdminFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General'
  });
  const [isDirectFaqFormOpen, setIsDirectFaqFormOpen] = useState(false);

  // Queries view tab: 'all' | 'pending' | 'solved'
  const [queryDashboardFilter, setQueryDashboardFilter] = useState('all');

  // Submit Query
  const handleRaiseQuery = async (e) => {
    e.preventDefault();
    if (!queryForm.question.trim()) return;

    const success = await raiseQuery(queryForm);
    if (success) {
      setQueryForm({
        question: '',
        description: '',
        category: 'General',
        raisedBy: ''
      });
      setActiveTab('faqs'); // Redirect to FAQ explorer
    }
  };

  // Submit Direct FAQ
  const handleDirectFaq = async (e) => {
    e.preventDefault();
    if (!adminFaqForm.question.trim() || !adminFaqForm.answer.trim()) return;

    const success = await addFAQDirectly(adminFaqForm);
    if (success) {
      setAdminFaqForm({
        question: '',
        answer: '',
        category: 'General'
      });
      setIsDirectFaqFormOpen(false);
    }
  };

  // Categories list extracted dynamically + 'All'
  const categories = ['All', ...new Set(faqs.map(faq => faq.category || 'General'))];

  // Filtering FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      activeCategory === 'All' || 
      (faq.category || 'General') === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Filtering Queries for dashboard
  const filteredQueries = queries.filter(q => {
    if (queryDashboardFilter === 'pending') return q.status === 'pending';
    if (queryDashboardFilter === 'solved') return q.status === 'solved';
    return true; // 'all'
  });

  // Toast icons selector
  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} style={{ color: '#10b981' }} />;
      case 'warning': return <AlertTriangle size={18} style={{ color: '#f59e0b' }} />;
      case 'danger': return <ShieldAlert size={18} style={{ color: '#ef4444' }} />;
      default: return <Info size={18} style={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <div className="container">
      {/* Dynamic Animated Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        flexWrap: 'wrap',
        gap: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
            padding: '0.7rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 15px hsla(var(--primary), 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HelpCircle size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', background: 'linear-gradient(120deg, #ffffff 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FAQ.Hub
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>Community-driven Knowledge Portal</p>
          </div>
        </div>

        {/* Role switch visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>
            Choose Role View Simulator
          </span>
          <div className="glass-tabs">
            <button 
              className={`glass-tab ${role === 'visitor' ? 'active' : ''}`}
              onClick={() => { setRole('visitor'); addToast('Switched to Visitor View', 'info'); }}
            >
              👥 Visitor
            </button>
            <button 
              className={`glass-tab ${role === 'contributor' ? 'active' : ''}`}
              onClick={() => { setRole('contributor'); addToast('Switched to Contributor View', 'info'); }}
            >
              🛠️ Contributor
            </button>
            <button 
              className={`glass-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); addToast('Switched to Administrator View', 'info'); }}
            >
              👑 Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Options and Operations Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="glass-tabs">
          <button 
            className={`glass-tab ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            <BookOpen size={16} /> FAQs
          </button>
          <button 
            className={`glass-tab ${activeTab === 'raise' ? 'active' : ''}`}
            onClick={() => setActiveTab('raise')}
          >
            <PlusCircle size={16} /> Raise a Query
          </button>
          {(role === 'contributor' || role === 'admin') && (
            <button 
              className={`glass-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <MessageSquare size={16} /> Solve Queries
              {queries.filter(q => q.status === 'pending').length > 0 && (
                <span style={{ 
                  background: 'hsl(var(--primary))', 
                  color: 'white', 
                  fontSize: '0.7rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '10px',
                  fontWeight: 700 
                }}>
                  {queries.filter(q => q.status === 'pending').length}
                </span>
              )}
            </button>
          )}
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={refreshData} 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          title="Refresh Data from Server"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* RENDER VIEWS */}

      {/* FAQ Explorer Page */}
      {activeTab === 'faqs' && (
        <div>
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search existing FAQs for immediate answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="main-grid">
            {/* FAQ listing */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'white' }}>Frequently Asked Questions</h2>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  Showing {filteredFaqs.length} FAQs
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="filter-row">
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {loadingFaqs ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--text-muted))' }}>
                  <RefreshCw className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '1rem' }}>Retrieving knowledge records...</p>
                </div>
              ) : filteredFaqs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredFaqs.map(faq => (
                    <FAQCard key={faq.id || faq._id} faq={faq} />
                  ))}
                </div>
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <HelpCircle size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>No matching FAQs found</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '400px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                    We couldn't find an answer to your query. Try adjusting your search term, filtering by category, or raise a new query to the community.
                  </p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('raise')}>
                    <Plus size={16} /> Raise a Query Now
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar with info */}
            <div>
              <div className="glass-card" style={{ position: 'sticky', top: '2rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'white' }}>FAQ Contribution Flow</h3>
                <ol style={{ 
                  paddingLeft: '1.2rem', 
                  margin: 0, 
                  color: 'hsl(var(--text-secondary))', 
                  fontSize: '0.9rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem' 
                }}>
                  <li>❓ <strong>Ask:</strong> If your question is not in FAQs, head over to <strong>Raise a Query</strong> and fill the query details.</li>
                  <li>💡 <strong>Solve:</strong> Members of our community or administrators answer/solve the open query.</li>
                  <li>🛡️ <strong>Review:</strong> Community answers go into an admin review queue. Admins can edit and refine the solution.</li>
                  <li>✨ <strong>Publish:</strong> Admin approves the solution, and it is automatically added right here into the FAQ repository!</li>
                </ol>
                
                {role === 'visitor' && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    padding: '1rem', 
                    background: 'rgba(56, 189, 248, 0.05)', 
                    border: '1px solid rgba(56, 189, 248, 0.15)', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem' 
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontWeight: 600 }}>💡 Evaluation Pro Tip</p>
                    <p style={{ margin: 0, color: 'hsl(var(--text-secondary))', lineHeight: 1.4 }}>
                      Use the <strong>Role Simulator</strong> in the top right to switch to <strong>Contributor</strong> or <strong>Admin</strong> views to answer and approve queries!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raise Query Section */}
      {activeTab === 'raise' && (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={22} style={{ color: 'hsl(var(--primary))' }} /> Raise a New Query
            </h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Can't find the answer you need in our FAQs? Raise a custom query, and our developers or administrators will publish a comprehensive answer.
            </p>

            <form onSubmit={handleRaiseQuery}>
              <div className="form-group">
                <label className="form-label">Query Subject / Question</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="e.g., How do I customize my portal profile?"
                  value={queryForm.question}
                  onChange={(e) => setQueryForm({...queryForm, question: e.target.value})}
                />
              </div>

              <div className="main-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: 0 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input"
                    value={queryForm.category}
                    onChange={(e) => setQueryForm({...queryForm, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Usage">Usage</option>
                    <option value="Technical">Technical</option>
                    <option value="Account">Account</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Name (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Alex"
                    value={queryForm.raisedBy}
                    onChange={(e) => setQueryForm({...queryForm, raisedBy: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Details / Context</label>
                <textarea 
                  rows={5}
                  className="form-input" 
                  style={{ resize: 'vertical' }}
                  placeholder="Provide context or elaborate on what you need help with..."
                  value={queryForm.description}
                  onChange={(e) => setQueryForm({...queryForm, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('faqs')}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Raise Active Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solve Query / Dashboard Section */}
      {activeTab === 'dashboard' && (role === 'contributor' || role === 'admin') && (
        <div>
          {/* Admin panel capabilities */}
          {role === 'admin' && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div className="glass-card" style={{ background: 'rgba(251, 191, 36, 0.02)', borderColor: 'rgba(251, 191, 36, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👑 Administrative Tool Deck
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                      Quick access controls to directly manage FAQs and review raised queries.
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', boxShadow: '0 4px 15px rgba(251,191,36,0.2)' }}
                    onClick={() => setIsDirectFaqFormOpen(!isDirectFaqFormOpen)}
                  >
                    <Plus size={16} /> {isDirectFaqFormOpen ? 'Close Editor' : 'Create FAQ Directly'}
                  </button>
                </div>

                {isDirectFaqFormOpen && (
                  <form onSubmit={handleDirectFaq} style={{ marginTop: '2rem', borderTop: '1px solid rgba(251, 191, 36, 0.1)', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'white' }}>Create a New FAQ Record</h3>
                    <div className="form-group">
                      <label className="form-label">FAQ Question</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        placeholder="e.g. How do I delete my account?"
                        value={adminFaqForm.question}
                        onChange={(e) => setAdminFaqForm({...adminFaqForm, question: e.target.value})}
                      />
                    </div>
                    <div className="main-grid" style={{ gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select 
                          className="form-input"
                          value={adminFaqForm.category}
                          onChange={(e) => setAdminFaqForm({...adminFaqForm, category: e.target.value})}
                        >
                          <option value="General">General</option>
                          <option value="Usage">Usage</option>
                          <option value="Technical">Technical</option>
                          <option value="Account">Account</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">FAQ Answer</label>
                      <textarea 
                        rows={4}
                        required
                        className="form-input" 
                        placeholder="Provide the comprehensive answer to resolve this question..."
                        value={adminFaqForm.answer}
                        onChange={(e) => setAdminFaqForm({...adminFaqForm, answer: e.target.value})}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsDirectFaqFormOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-success" style={{ background: '#fbbf24', color: 'black' }}>
                        Publish Direct FAQ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Queries Listing for Contributor/Admin */}
          <div className="main-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'white' }}>
                  {role === 'admin' ? 'Review & Approve Queries' : 'Open Contribution Desk'}
                </h2>
                
                {/* Filter selector */}
                <div className="glass-tabs" style={{ padding: '0.2rem' }}>
                  <button 
                    className={`glass-tab ${queryDashboardFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setQueryDashboardFilter('all')}
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                  >
                    All ({queries.length})
                  </button>
                  <button 
                    className={`glass-tab ${queryDashboardFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setQueryDashboardFilter('pending')}
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                  >
                    Open ({queries.filter(q => q.status === 'pending').length})
                  </button>
                  <button 
                    className={`glass-tab ${queryDashboardFilter === 'solved' ? 'active' : ''}`}
                    onClick={() => setQueryDashboardFilter('solved')}
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                  >
                    Solved ({queries.filter(q => q.status === 'solved').length})
                  </button>
                </div>
              </div>

              {loadingQueries ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--text-muted))' }}>
                  <RefreshCw className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '1rem' }}>Query loading sequence...</p>
                </div>
              ) : filteredQueries.length > 0 ? (
                <div>
                  {filteredQueries.map(q => (
                    <QueryCard key={q.id || q._id} query={q} />
                  ))}
                </div>
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <MessageSquare size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '1rem' }} />
                  <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No queries found</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                    There are currently no queries matching this category. Feel free to raise a test query in the <strong>Raise a Query</strong> tab to run through the flow!
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar details */}
            <div>
              <div className="glass-card" style={{ position: 'sticky', top: '2rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'white' }}>Current Active Role</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span className={`role-pill role-${role}`}>
                    {role === 'admin' ? <ShieldAlert size={12} /> : <User size={12} />}
                    {role} view
                  </span>
                </div>

                {role === 'contributor' ? (
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5, margin: 0 }}>
                    As a <strong>Contributor</strong>, you have access to open community questions. 
                    Submit answers to help users. Once submitted, they are marked as <strong>Solved</strong> and queued for Administrator oversight.
                  </p>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5, margin: 0 }}>
                    As an <strong>Administrator</strong>, you are the final curator of knowledge. 
                    You can directly answer any unresolved user query, or review proposed solutions. 
                    Modify contributor solutions to ensure accurate formatting, then click <strong>Approve & Add to FAQ</strong> to publish!
                  </p>
                )}

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem' }}>Metrics</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.35rem' }}>
                    <span>Total Queries</span>
                    <strong style={{ color: 'white' }}>{queries.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.35rem' }}>
                    <span>Open / Unsolved</span>
                    <strong style={{ color: '#f59e0b' }}>{queries.filter(q => q.status === 'pending').length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.35rem' }}>
                    <span>Solved (Awaiting Review)</span>
                    <strong style={{ color: '#3b82f6' }}>{queries.filter(q => q.status === 'solved').length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM CONTAINER */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            {getToastIcon(toast.type)}
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'hsl(var(--text-muted))', 
                cursor: 'pointer',
                marginLeft: '0.5rem',
                fontSize: '1rem',
                padding: 0
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Wrap main app content in context provider
const App = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
