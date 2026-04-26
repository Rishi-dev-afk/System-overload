import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(credentials.username, credentials.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-accent-blue mb-2">System Overload</h1>
          <p className="text-text-secondary">Gamified Computer Science Learning</p>
        </div>

        <div className="bg-dark-card p-8 rounded-lg border border-dark-border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {isLogin ? 'Welcome Back' : 'Join the System'}
            </h2>
            <p className="text-text-secondary">
              {isLogin ? 'Sign in to continue your learning journey' : 'Create your account to start learning'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-blue focus:outline-none transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-blue focus:outline-none transition-colors"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent-blue text-dark-bg font-semibold rounded-lg hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent-purple hover:text-accent-blue transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <div className="text-center text-text-secondary text-sm">
          <p>Demo credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};