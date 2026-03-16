import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab] = useState('rooms'); // 'rooms' | 'logs' | 'cleaners'
  
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    if (tab === 'cleaners') return; // Handled separately
    setLoading(true);
    try {
      if (tab === 'rooms') {
        const res = await api.get('/admin/rooms');
        setData(res.data);
      } else if (tab === 'logs') {
        const res = await api.get('/admin/logs');
        setData(res.data);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateCleaner = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/admin/create-cleaner', form);
      setMessage('✅ Cleaner account created successfully');
      setForm({ username: '', password: '' });
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.detail || 'Failed to create cleaner'}`);
    }
  };

  const StatusColor = (status) => {
    const colors = {
      AVAILABLE: 'text-emerald-400',
      OCCUPIED: 'text-amber-400',
      DIRTY: 'text-red-400',
      CLEANING: 'text-blue-400',
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-brand-900/20 to-gray-950">
      <header className="sticky top-0 z-10 bg-gray-950/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <span className="text-lg font-bold text-white">Admin Portal</span>
          </div>
          <button id="admin-logout" onClick={() => { logout(); navigate('/login'); }} className="btn-secondary text-sm px-3 py-1.5">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setTab('rooms')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'rooms' ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Rooms Overview
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'logs' ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setTab('cleaners')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'cleaners' ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Manage Cleaners
          </button>
        </div>

        {tab === 'rooms' && (
          <div className="glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">All Rooms Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.map(room => (
                <div key={room.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                  <span className="text-lg font-bold text-white mb-1">Room {room.room_number}</span>
                  <span className={`text-xs font-bold ${StatusColor(room.status)}`}>{room.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="glass p-6 overflow-x-auto">
            <h2 className="text-xl font-bold text-white mb-4">System Audit Logs</h2>
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-gray-300">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 rounded-tr-xl font-medium">Target ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white">{log.action}</td>
                    <td className="px-4 py-3">{log.user_id}</td>
                    <td className="px-4 py-3">{log.target_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'cleaners' && (
          <div className="glass w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create Cleaner Account</h2>
            {message && (
              <div className={`mb-4 px-4 py-3 border rounded-xl text-sm ${message.startsWith('✅') ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleCreateCleaner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-primary w-full mt-2">
                Create Cleaner
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
