import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';
import { createSocket } from '../websocket/socket';
import CleaningTaskCard from '../components/CleaningTaskCard';

export default function CleanerDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cleaner/tasks');
      setTasks(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTasks();

    // Setup WebSocket
    const socket = createSocket((message) => {
      // If server says new task, refresh the task list
      if (message.event === 'NEW_TASK') {
        fetchTasks();
      }
    });

    return () => socket.destroy();
  }, [fetchTasks]);

  const handleUpdate = () => {
    fetchTasks();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-brand-900/20 to-gray-950">
      <header className="sticky top-0 z-10 bg-gray-950/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧹</span>
            <span className="text-lg font-bold text-white">Cleaner Dashboard</span>
          </div>
          <button id="cleaner-logout" onClick={handleLogout} className="btn-secondary text-sm px-3 py-1.5">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Cleaning Tasks</h1>
          <button onClick={fetchTasks} className="btn-secondary text-sm px-3 py-1.5">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <span className="text-5xl mb-3">✨</span>
            <p>You have no pending tasks right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <CleaningTaskCard key={task.id} task={task} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
