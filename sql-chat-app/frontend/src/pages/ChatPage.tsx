import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/authService';
import Sidebar from '../components/Sidebar';
import '../App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: number;
  title: string;
  updated_at: string;
  created_at: string;
}

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations/');
      setConversations(response.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/conversations/${id}/`);
      setMessages(response.data.messages);
      setCurrentConversationId(id);
      setSidebarOpen(false); // Close sidebar on mobile after selection
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation history.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message to chat immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const payload: any = { message: userMessage };
      if (currentConversationId) {
        payload.conversation_id = currentConversationId;
      }

      const response = await api.post('/chat/', payload);

      if (response.data && response.data.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.response },
        ]);

        // If this was a new conversation, update state and fetch list
        if (!currentConversationId && response.data.conversation_id) {
          setCurrentConversationId(response.data.conversation_id);
          fetchConversations();
        } else {
          // Refresh list to update timestamps/titles
          fetchConversations();
        }
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
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewChat={startNewChat}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="main-content">
        <div className="app-card">
          <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                <span>☰</span>
              </button>
              <div>
                <p className="eyebrow">SQL Chat Assistant</p>
                <h1>Ask database questions in plain language</h1>
              </div>
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

          <p className="subtext" style={{ padding: '0 24px' }}>
            Welcome, {user?.username || 'User'}! Your messages are routed to the backend API.
          </p>


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
      </main>
    </div>
  );
};

export default ChatPage;
