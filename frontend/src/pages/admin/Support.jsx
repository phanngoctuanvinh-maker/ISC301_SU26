import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './Support.css';

function Support() {
  const [threads, setThreads] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef(null);
  const threadsIntervalRef = useRef(null);
  const messagesIntervalRef = useRef(null);

  // Poll for threads list on mount
  useEffect(() => {
    fetchThreads();
    threadsIntervalRef.current = setInterval(fetchThreads, 4000);

    return () => {
      if (threadsIntervalRef.current) clearInterval(threadsIntervalRef.current);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    };
  }, []);

  // Poll for messages when selectedSessionId changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchMessages(true);
      
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
      messagesIntervalRef.current = setInterval(() => fetchMessages(false), 4000);
    } else {
      setMessages([]);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    }

    return () => {
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    };
  }, [selectedSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const response = await api.get('/support/admin/threads');
      setThreads(response.data || []);
      setLoadingThreads(false);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setLoadingThreads(false);
    }
  };

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const response = await api.get(`/support/admin/messages/${selectedSessionId}`);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId) return;

    try {
      setSendingReply(true);
      const response = await api.post(`/support/admin/messages/${selectedSessionId}`, {
        message: replyText.trim()
      });
      setMessages(prev => [...prev, response.data]);
      setReplyText('');
      fetchThreads(); // Refresh thread list to update latest snippet
    } catch (err) {
      alert(err.message || 'Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSendingReply(false);
    }
  };

  const selectedThread = threads.find(t => t.session_id === selectedSessionId);

  return (
    <div className="admin-support-container glass-card">
      {/* Left Column: Chat Threads List */}
      <div className="admin-support-threads-sidebar">
        <div className="sidebar-header">
          <h3>Hội thoại CSKH</h3>
          <span className="badge badge-secondary">{threads.length} Khách hàng</span>
        </div>

        {loadingThreads && threads.length === 0 ? (
          <div className="sidebar-loader">Đang tải danh sách...</div>
        ) : threads.length === 0 ? (
          <div className="sidebar-empty">Không có hội thoại nào</div>
        ) : (
          <div className="sidebar-list">
            {threads.map((thread) => {
              const isSelected = thread.session_id === selectedSessionId;
              const formattedTime = new Date(thread.latest_time).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              });
              const isUser = thread.session_id.startsWith('user_');

              return (
                <div
                  key={thread.session_id}
                  className={`thread-item-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSessionId(thread.session_id)}
                >
                  <div className="thread-item-avatar">
                    {isUser ? '👤' : '💬'}
                  </div>
                  <div className="thread-item-info">
                    <div className="thread-item-info-top">
                      <strong className="thread-item-name">{thread.name || 'Khách vãng lai'}</strong>
                      <span className="thread-item-time">{formattedTime}</span>
                    </div>
                    <p className="thread-item-snippet">{thread.latest_message}</p>
                    <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                      {isUser ? 'Thành viên' : 'Khách vãng lai'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Chat Pane */}
      <div className="admin-support-chat-pane">
        {selectedSessionId ? (
          <div className="support-chat-full-view">
            {/* Chat Pane Header */}
            <div className="chat-pane-header">
              <div className="chat-header-user-info">
                <h3>{selectedThread?.name || 'Khách vãng lai'}</h3>
                {selectedThread?.email && (
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Email: <strong>{selectedThread.email}</strong>
                  </small>
                )}
              </div>
              <span className={`badge ${selectedSessionId.startsWith('user_') ? 'badge-success' : 'badge-secondary'}`}>
                {selectedSessionId.startsWith('user_') ? 'Thành viên' : 'Khách'}
              </span>
            </div>

            {/* Chat Messages Log */}
            {loadingMessages ? (
              <div className="chat-pane-loader">Đang tải cuộc trò chuyện...</div>
            ) : (
              <div className="chat-pane-messages-list">
                {messages.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin';
                  return (
                    <div key={msg.id} className={`support-message-bubble ${isAdmin ? 'admin' : 'customer'}`}>
                      <div className="msg-content">
                        {msg.message}
                      </div>
                      <small className="msg-time">
                        {new Date(msg.created_at).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </small>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Chat Pane Reply Form */}
            <form onSubmit={handleSendReply} className="chat-pane-input-form">
              <textarea
                placeholder="Nhập tin nhắn phản hồi của bạn..."
                className="form-control"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sendingReply}
                rows="2"
                style={{ resize: 'none', fontSize: '0.9rem' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(e);
                  }
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={sendingReply || !replyText.trim()}
                style={{ alignSelf: 'stretch', padding: '0 1.5rem', display: 'flex', alignItems: 'center' }}
              >
                {sendingReply ? 'Đang gửi...' : 'Gửi'}
              </button>
            </form>
          </div>
        ) : (
          <div className="support-chat-placeholder">
            <span style={{ fontSize: '3rem' }}>💬</span>
            <h3>Trò chuyện Chăm sóc khách hàng</h3>
            <p>Chọn một hội thoại bên cột trái để bắt đầu phản hồi khách hàng trực tuyến.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Support;
