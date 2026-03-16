import { useState } from 'react';
import api from '../api/apiClient';

const STATUS_COLORS = {
  PENDING:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CLEANING:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function CleaningTaskCard({ task, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleAction = async (action) => {
    setError('');
    setLoading(true);
    try {
      await api.post(`/cleaner/${action}/${task.id}`);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-lg">Room {task.room_number ?? task.room_id}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Task #{task.id}</p>
        </div>
        <span className={`status-badge border ${STATUS_COLORS[task.status] || 'bg-gray-500/20 text-gray-300'}`}>
          {task.status}
        </span>
      </div>

      {task.created_at && (
        <p className="text-xs text-gray-500">
          Assigned: {new Date(task.created_at).toLocaleString()}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-3 mt-1">
        {task.status === 'PENDING' && (
          <button
            id={`start-task-${task.id}`}
            onClick={() => handleAction('start')}
            disabled={loading}
            className="btn-primary flex-1 text-sm"
          >
            {loading ? 'Starting...' : '▶ Start Cleaning'}
          </button>
        )}
        {task.status === 'CLEANING' && (
          <button
            id={`complete-task-${task.id}`}
            onClick={() => handleAction('complete')}
            disabled={loading}
            className="btn-success flex-1 text-sm"
          >
            {loading ? 'Completing...' : '✓ Mark Completed'}
          </button>
        )}
        {task.status === 'COMPLETED' && (
          <span className="text-emerald-400 text-sm font-semibold">✓ Done</span>
        )}
      </div>
    </div>
  );
}
