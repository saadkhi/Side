import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Auto-detect backend URL - use same host with port 8000
const API_URL = process.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/chat/`;

// Create axios instance with longer timeout
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 5 minute timeout for model generation
  headers: {
    'Content-Type': 'application/json',
  }
});

function App() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{user: string, bot: string, error?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Check if backend is available on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('Checking backend connection at:', API_URL);
        await apiClient.options('');
        setBackendStatus('connected');
        console.log('✓ Backend connected successfully');
      } catch (error) {
        setBackendStatus('disconnected');
        console.error('✗ Backend not reachable at:', API_URL, error);
      }
    };
    
    checkBackend();
  }, []);

  // Timer for elapsed time during request
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const send = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (backendStatus === 'disconnected') {
      alert(`Cannot connect to backend at ${API_URL}. Make sure Django server is running at http://localhost:8000`);
      return;
    }

    setLoading(true);
    setElapsedTime(0);
    try {
      console.log('Sending message to:', API_URL);
      const res = await apiClient.post('', { message });
      
      console.log('Response received:', res.data);
      
      if (res.data.error) {
        setHistory([...history, { user: message, bot: '', error: res.data.error }]);
      } else {
        setHistory([...history, { user: message, bot: res.data.response }]);
      }
      setMessage('');
    } catch (error: any) {
      let errorMsg = 'Unknown error occurred';
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = `Request timeout after ${formatTime(elapsedTime)}. Model is taking very long to generate response. Please try a simpler query.`;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.status === 503) {
        errorMsg = 'Server is not ready - model is still loading. Please wait a moment and try again.';
      } else if (error.request && !error.response) {
        errorMsg = `Network error - cannot connect to server at ${API_URL}. Is Django running?`;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      console.error('Chat error:', error);
      setHistory([...history, { user: message, bot: '', error: errorMsg }]);
      setMessage('');
    } finally {
      setLoading(false);
      setElapsedTime(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>SQL Chat Assistant</h1>
        <div style={{
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: backendStatus === 'connected' ? '#4caf50' : backendStatus === 'disconnected' ? '#f44336' : '#ff9800',
          color: 'white'
        }}>
          Backend: {backendStatus === 'connected' ? '✓ Connected' : backendStatus === 'disconnected' ? '✗ Disconnected' : 'Checking...'}
        </div>
      </div>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
        {history.length === 0 && <p style={{ color: '#999' }}>No messages yet. Start chatting!</p>}
        {history.map((h, i) => (
          <div key={i} style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#333' }}>You:</strong> {h.user}<br/>
            {h.error ? (
              <div style={{ color: '#d32f2f', fontStyle: 'italic' }}>
                <strong>Error:</strong> {h.error}
              </div>
            ) : (
              <div>
                <strong style={{ color: '#1976d2' }}>Bot:</strong> {h.bot}
              </div>
            )}
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || backendStatus !== 'connected'}
          placeholder="Enter your SQL question here..."
          style={{
            flex: 1,
            padding: '10px',
            fontFamily: 'Arial',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minHeight: '60px',
            opacity: (loading || backendStatus !== 'connected') ? 0.6 : 1,
            cursor: (loading || backendStatus !== 'connected') ? 'not-allowed' : 'text'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={send}
            disabled={loading || backendStatus !== 'connected'}
            style={{
              padding: '10px 20px',
              backgroundColor: (loading || backendStatus !== 'connected') ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loading || backendStatus !== 'connected') ? 'not-allowed' : 'pointer',
              height: 'fit-content',
              fontWeight: 'bold'
            }}
          >
            {loading ? `Sending... ${formatTime(elapsedTime)}` : 'Send'}
          </button>
          {loading && (
            <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
              Model generating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;