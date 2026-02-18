// In frontend/src/App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
      }}>
        <div style={{ color: '#39ff14', fontSize: '24px', fontWeight: '700', letterSpacing: '2px' }}>LOADING...</div>
      </div>
    );
  }

  return isAuthenticated ? <ChatPage /> : <AuthPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;