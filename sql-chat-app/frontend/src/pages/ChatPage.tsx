import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/authService';
import '../App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await api.post('/chat/', {
        message: userMessage,
      });

      if (response.data && response.data.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.response },
        ]);
      } else {
        throw new Error('No response data received');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        'Failed to get a response from the server. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="app">
      <div className="app-card">
        <header className="app-header">
          <div>
            <p className="eyebrow">SQL Chat Assistant</p>
            <h1>Ask database questions in plain language</h1>
            <p className="subtext">
              Welcome, {user?.username || 'User'}! Your messages are routed to the backend API and answered by the model.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="status-pill">
              <span className={`dot ${isLoading ? 'warning' : 'ok'}`} />
              {isLoading ? 'Waiting for response...' : 'Ready'}
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: '#333',
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="chat-window">
          {messages.length === 0 ? (
            <div className="empty-state">
              Start a conversation by typing a message below
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-role">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="input-row">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your SQL query or question here..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading || !message.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
