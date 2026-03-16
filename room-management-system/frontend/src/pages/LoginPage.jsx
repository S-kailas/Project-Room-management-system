import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      // OAuth2 form expects application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('username', form.username);
      params.append('password', form.password);

      const { data } = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      login(data.access_token, data.role);

      if (data.role === 'ADMIN')   navigate('/admin');
      else if (data.role === 'CRE') navigate('/cre');
      else                          navigate('/cleaner');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-brand-900/30 to-gray-950">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl" />
      </div>

      <div className="relative glass w-full max-w-md p-10 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-3xl shadow-lg shadow-brand-600/40 mb-4">
            🏨
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">RoomManager</h1>
          <p className="text-gray-400 text-sm mt-1">Lodging & Housekeeping System</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input
              id="login-username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 py-3 text-base"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Secured with JWT · Role-based access
        </p>
      </div>
    </div>
  );
}
