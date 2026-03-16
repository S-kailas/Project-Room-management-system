import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import RoomCard from '../components/RoomCard';
import CheckinModal from '../components/CheckinModal';
import CheckoutModal from '../components/CheckoutModal';

export default function CREDashboard() {
  const { logout }     = useAuth();
  const navigate       = useNavigate();
  const [tab, setTab]  = useState('available'); // 'available' | 'occupied'
  const [rooms, setRooms]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modal, setModal] = useState(null); // 'checkin' | 'checkout'

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'available' ? '/rooms/available' : '/rooms/occupied';
      const { data } = await api.get(endpoint);
      setRooms(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setModal(tab === 'available' ? 'checkin' : 'checkout');
  };

  const handleModalClose = () => {
    setSelectedRoom(null);
    setModal(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    fetchRooms();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-brand-900/20 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏨</span>
            <span className="text-lg font-bold text-white">CRE Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchRooms} className="btn-secondary text-sm px-3 py-1.5">↻ Refresh</button>
            <button id="cre-logout" onClick={handleLogout} className="btn-danger text-sm px-3 py-1.5">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab switcher */}
        <div className="flex gap-3 mb-8">
          <button
            id="tab-available"
            onClick={() => setTab('available')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              tab === 'available'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            🟢 Available Rooms
          </button>
          <button
            id="tab-occupied"
            onClick={() => setTab('occupied')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              tab === 'occupied'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            🟡 Occupied Rooms
          </button>
        </div>

        {/* Room grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <span className="text-5xl mb-3">🏷️</span>
            <p>No {tab} rooms right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={handleRoomClick} />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === 'checkin' && selectedRoom && (
        <CheckinModal room={selectedRoom} onClose={handleModalClose} onSuccess={handleSuccess} />
      )}
      {modal === 'checkout' && selectedRoom && (
        <CheckoutModal room={selectedRoom} onClose={handleModalClose} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
