import { useState } from 'react';
import api from '../api/apiClient';

export default function CheckinModal({ room, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    payment_method: 'Cash',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Card', 'Online'];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.payment_method) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('phone', form.phone);
      data.append('payment_method', form.payment_method);
      data.append('room_id', room.id);
      if (file) data.append('aadhaar_image', file);

      await api.post('/checkin', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-8 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Check-In — Room {room.room_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Guest Name *</label>
            <input
              id="checkin-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number *</label>
            <input
              id="checkin-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, payment_method: opt }))}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    form.payment_method === opt
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              id="checkin-payment"
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              placeholder="Or type custom payment method"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Aadhaar Image</label>
            <input
              id="checkin-aadhaar"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-600/40 file:text-white hover:file:bg-brand-600/60 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Optional for returning guests</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Checking in...' : 'Confirm Check-In'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
