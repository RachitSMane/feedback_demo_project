import React, { useState } from 'react';
import { ChevronDown, MessageSquare } from 'lucide-react';

const FAQCard = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`glass-item ${isOpen ? 'active-accordion' : ''}`} style={{ transition: 'all 0.3s ease' }}>
      <div 
        className="accordion-header" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.03)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span className="cat-badge">{faq.category || 'General'}</span>
          <span className="accordion-title">{faq.question}</span>
        </div>
        <ChevronDown className={`accordion-arrow ${isOpen ? 'open' : ''}`} size={18} />
      </div>

      <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
        <div className="accordion-content">
          <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{faq.answer}</p>
          <div style={{ 
            marginTop: '1rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.75rem', 
            color: 'hsl(var(--text-muted))'
          }}>
            <span>Added to FAQ Repository</span>
            <span>{faq.createdAt ? new Date(faq.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Recently'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQCard;
