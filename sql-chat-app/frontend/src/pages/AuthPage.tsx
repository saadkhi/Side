import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../media/logo_talk2db.png';
import './AuthPage.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(username, email, password, passwordConfirm, firstName, lastName);
      }
    } catch (err: any) {
      const data = err?.response?.data;
      let errorMsg = '';

      if (data) {
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (typeof data === 'object') {
          // Handle DRF validation errors like { "email": ["..."], "username": ["..."] }
          const firstField = Object.keys(data)[0];
          const firstError = data[firstField];
          errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      }

      setError(
        errorMsg ||
        err?.message ||
        (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img src={logo} alt="Talk2DB Logo" className="auth-logo" style={{ width: '80px', marginBottom: '20px' }} />
          <h1>Talk2DB</h1>
          <p>{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          {!isLogin && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="passwordConfirm">Confirm Password</label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirm Password"
                required
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setPassword('');
                setPasswordConfirm('');
              }}
              className="auth-switch-button"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
