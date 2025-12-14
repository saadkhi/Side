// In frontend/src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// Configure axios with better defaults
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Sending request:', config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const response = await api.post('/chat/', { 
        message: userMessage 
      });
      
      if (response.data && response.data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      } else {
        throw new Error('No response data received');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get response from the server. Please try again.');
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

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#2c3e50',
        marginBottom: '20px'
      }}>
        SQL Chat Assistant
      </h1>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666',
            fontStyle: 'italic'
          }}>
            Start a conversation by typing a message below
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              style={{ 
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                borderRadius: '5px',
                borderLeft: `4px solid ${msg.role === 'user' ? '#1976d2' : '#4caf50'}`
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                color: msg.role === 'user' ? '#1565c0' : '#2e7d32',
                marginBottom: '5px'
              }}>
                {msg.role === 'user' ? 'You' : 'Assistant'}:
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your SQL query or question here..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minHeight: '60px',
            maxHeight: '200px',
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !message.trim()}
          style={{
            padding: '0 20px',
            backgroundColor: isLoading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading || !message.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;