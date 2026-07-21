import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiMail, FiTrash2, FiSearch, FiDownload } from 'react-icons/fi';
import '../Admin.css';

export default function Inbox() {
  const { messages, fetchMessages, updateMessageStatus, deleteMessage } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const selectedMessage = messages.find(m => m._id === selectedMessageId);

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSelectMessage = (msg) => {
    setSelectedMessageId(msg._id);
    if (!msg.isRead) {
      updateMessageStatus(msg._id, { isRead: true });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message permanently?')) {
      await deleteMessage(id);
      if (selectedMessageId === id) {
        setSelectedMessageId(null);
      }
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    if (messages.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Service Required', 'Subject', 'Message', 'Date'];
    const rows = messages.map(m => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.email.replace(/"/g, '""')}"`,
      `"${(m.phone || '').replace(/"/g, '""')}"`,
      `"${(m.serviceRequired || '').replace(/"/g, '""')}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${m.message.replace(/"/g, '""')}"`,
      new Date(m.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `messages_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.serviceRequired || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Contact Inbox</h1>
          <p className="admin-header-subtitle">Manage messages sent from your site contact forms</p>
        </div>
        {messages.length > 0 && (
          <button className="admin-btn admin-btn-secondary" onClick={exportToCSV}>
            <FiDownload /> Export CSV
          </button>
        )}
      </div>

      {/* Inbox Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', minHeight: '600px' }}>
        
        {/* Messages List Column */}
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Search sender, email, subject..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredMessages.length === 0 ? (
              <div style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: '40px 0' }}>
                No messages found.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div 
                  key={msg._id} 
                  onClick={() => handleSelectMessage(msg)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: selectedMessageId === msg._id 
                      ? 'var(--admin-primary-glow)' 
                      : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: selectedMessageId === msg._id 
                      ? 'var(--admin-primary)' 
                      : 'var(--admin-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {!msg.isRead && (
                    <div style={{
                      position: 'absolute',
                      right: '16px',
                      top: '16px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--admin-primary)'
                    }} />
                  )}
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', paddingRight: '12px' }}>{msg.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '8px' }}>{msg.subject || 'No Subject'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{new Date(msg.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Preview Column */}
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', padding: '32px' }}>
          {selectedMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--admin-border)', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{selectedMessage.subject || 'No Subject'}</h2>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>From: <strong style={{ color: 'var(--admin-text-main)' }}>{selectedMessage.name}</strong> ({selectedMessage.email})</span>
                      {selectedMessage.phone && <span>Phone: <strong style={{ color: 'var(--admin-text-main)' }}>{selectedMessage.phone}</strong></span>}
                      {selectedMessage.serviceRequired && <span>Service: <strong style={{ color: 'var(--admin-text-main)' }}>{selectedMessage.serviceRequired}</strong></span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="admin-btn admin-btn-secondary" 
                      onClick={() => updateMessageStatus(selectedMessage._id, { isRead: !selectedMessage.isRead })}
                      style={{ padding: '8px 12px' }}
                    >
                      {selectedMessage.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button 
                      className="admin-btn admin-btn-danger" 
                      style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      onClick={() => handleDelete(selectedMessage._id)}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--admin-text-main)' }}>
                  {selectedMessage.message}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Received: {new Date(selectedMessage.createdAt).toLocaleString()}
                </div>
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || ''}`} 
                  className="admin-btn admin-btn-primary"
                >
                  <FiMail /> Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--admin-text-muted)' }}>
              <FiMail size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div>Select a message from the list to preview details</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
