import { useState } from 'react';
import api from '../api/apiClient';

export default function CheckoutModal({ room, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCheckout = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post(`/checkout/${room.id}`);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-sm p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Checkout — Room {room.room_number}</h2>
        <p className="text-gray-400 mb-6 text-sm">
          This will mark the room as <span className="text-red-400 font-semibold">Dirty</span> and automatically assign a cleaner.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            id="confirm-checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
            className="btn-danger flex-1"
          >
            {loading ? 'Processing...' : '✓ Confirm Checkout'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
