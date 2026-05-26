import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Trash2, Send, CornerDownRight, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

const QueryCard = ({ query }) => {
  const { role, solveQuery, approveQuery, deleteQuery } = useApp();
  const [solutionText, setSolutionText] = useState('');
  const [adminOverrideText, setAdminOverrideText] = useState(
    query.solutions && query.solutions.length > 0 ? query.solutions[0].answer : ''
  );
  const [contributorName, setContributorName] = useState('');
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);

  const handleSolveSubmit = async (e) => {
    e.preventDefault();
    if (!solutionText.trim()) return;

    const success = await solveQuery(query.id || query._id, {
      answer: solutionText,
      solvedBy: contributorName.trim() || 'Contributor'
    });

    if (success) {
      setSolutionText('');
      setContributorName('');
      setIsActionPanelOpen(false);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    const finalAnswer = adminOverrideText.trim();
    if (!finalAnswer) return;

    await approveQuery(query.id || query._id, {
      answer: finalAnswer
    });
  };

  const handleDeleteClick = async () => {
    if (confirm('Are you sure you want to dismiss this query?')) {
      await deleteQuery(query.id || query._id);
    }
  };

  // Status badges mapping
  const statusLabel = {
    pending: { text: 'Open/Unsolved', class: 'status-pending' },
    solved: { text: 'Solved (Review Required)', class: 'status-solved' },
    approved: { text: 'Approved', class: 'status-approved' }
  };

  const currentStatus = statusLabel[query.status] || { text: query.status, class: '' };

  return (
    <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="cat-badge">{query.category || 'General'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span className={`status-dot ${currentStatus.class}`}></span>
            <span style={{ color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>{currentStatus.text}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <User size={12} /> {query.raisedBy || 'Anonymous'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={12} /> {new Date(query.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Query Title & Description */}
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white' }}>{query.question}</h3>
      {query.description && (
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'hsl(var(--text-secondary))', 
          lineHeight: 1.5, 
          background: 'rgba(255,255,255,0.02)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '2px solid hsl(var(--primary-glow))',
          marginBottom: '1rem' 
        }}>
          {query.description}
        </p>
      )}

      {/* Solutions Listing if any exist */}
      {query.solutions && query.solutions.length > 0 && (
        <div style={{ margin: '1rem 0', paddingLeft: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CornerDownRight size={14} /> Proposed Solutions ({query.solutions.length})
          </h4>
          {query.solutions.map((sol, index) => (
            <div key={sol.id || index} style={{ 
              background: 'rgba(59, 130, 246, 0.04)', 
              border: '1px solid rgba(59, 130, 246, 0.1)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem',
              marginBottom: '0.5rem' 
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'hsl(var(--text-primary))' }}>{sol.answer}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>
                <span>Solved by: <strong>{sol.solvedBy}</strong></span>
                <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons based on Role & Status */}
      <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Helper text */}
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
          {query.status === 'pending' && role === 'visitor' && 'Waiting for contributions...'}
          {query.status === 'solved' && role === 'visitor' && 'Under review by Administrator.'}
        </span>

        {/* Action button triggers */}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          
          {/* Contributor: Submit Solution Panel Trigger */}
          {role === 'contributor' && query.status === 'pending' && !isActionPanelOpen && (
            <button className="btn btn-primary" onClick={() => setIsActionPanelOpen(true)}>
              <MessageSquare size={16} /> Contribute Solution
            </button>
          )}

          {/* Admin Panels Trigger & Actions */}
          {role === 'admin' && (
            <>
              {/* Delete / Reject Query */}
              <button className="btn btn-secondary" style={{ color: 'hsl(var(--danger))' }} onClick={handleDeleteClick} title="Dismiss Query">
                <Trash2 size={16} /> Dismiss
              </button>

              {/* Pending Query: Admin directly solve */}
              {query.status === 'pending' && !isActionPanelOpen && (
                <button className="btn btn-primary" onClick={() => setIsActionPanelOpen(true)}>
                  <MessageSquare size={16} /> Solve & Approve
                </button>
              )}

              {/* Solved Query: Admin Review Panel Trigger */}
              {query.status === 'solved' && !isActionPanelOpen && (
                <button className="btn btn-success" onClick={() => setIsActionPanelOpen(true)}>
                  <Check size={16} /> Review proposed solution
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanding Interactive Actions Panel (Form) */}
      {isActionPanelOpen && (
        <div style={{ 
          marginTop: '1.25rem', 
          padding: '1.25rem', 
          background: 'rgba(255, 255, 255, 0.01)', 
          border: '1px dashed hsl(var(--border-glass))', 
          borderRadius: 'var(--radius-md)',
          animation: 'slideIn 0.3s ease forwards'
        }}>
          {/* Contributor Solving Form */}
          {role === 'contributor' && query.status === 'pending' && (
            <form onSubmit={handleSolveSubmit}>
              <h4 style={{ marginBottom: '1rem', color: 'white' }}>Submit Your Proposed Solution</h4>
              <div className="form-group">
                <label className="form-label">Your Contributor Name (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Solution Details (Be clear and concise)</label>
                <textarea 
                  rows={4}
                  required
                  className="form-input" 
                  style={{ resize: 'vertical' }}
                  placeholder="Type your detailed answer here..."
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsActionPanelOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} /> Submit Solution
                </button>
              </div>
            </form>
          )}

          {/* Admin Directly Solving Form */}
          {role === 'admin' && query.status === 'pending' && (
            <form onSubmit={handleApproveSubmit}>
              <h4 style={{ marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} style={{ color: 'hsl(var(--primary))' }} /> Solve and Approve Query
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                Answering this query will immediately publish it to the FAQ repository and remove it from active queries.
              </p>
              <div className="form-group">
                <label className="form-label">Official Answer Details</label>
                <textarea 
                  rows={4}
                  required
                  className="form-input" 
                  style={{ resize: 'vertical' }}
                  placeholder="Type the official answer here..."
                  value={adminOverrideText}
                  onChange={(e) => setAdminOverrideText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsActionPanelOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} /> Publish to FAQ
                </button>
              </div>
            </form>
          )}

          {/* Admin Reviewing/Editing Solution Form */}
          {role === 'admin' && query.status === 'solved' && (
            <form onSubmit={handleApproveSubmit}>
              <h4 style={{ marginBottom: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={18} style={{ color: 'hsl(var(--success))' }} /> Review & Publish
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
                Review the contributor's solution. You can edit the text below to polish or correct it before adding it live.
              </p>
              <div className="form-group">
                <label className="form-label">Edit Final Answer (FAQ Content)</label>
                <textarea 
                  rows={5}
                  required
                  className="form-input" 
                  style={{ resize: 'vertical' }}
                  value={adminOverrideText}
                  onChange={(e) => setAdminOverrideText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsActionPanelOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} /> Approve & Add to FAQ
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryCard;
