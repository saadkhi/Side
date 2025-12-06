import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{user: string, bot: string}[]>([]);

  const send = async () => {
    const res = await axios.post('http://localhost:8000/api/chat/', { message });
    setHistory([...history, { user: message, bot: res.data.response }]);
    setMessage('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>SQL Chat Assistant</h1>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {history.map((h, i) => (
          <div key={i}>
            <strong>You:</strong> {h.user}<br/>
            <strong>Bot:</strong> {h.bot}<br/><br/>
          </div>
        ))}
      </div>
      <input value={message} onChange={e => setMessage(e.target.value)} style={{ width: '80%' }} />
      <button onClick={send}>Send</button>
    </div>
  );
}

export default App;