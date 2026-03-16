const STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  OCCUPIED:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DIRTY:     'bg-red-500/20 text-red-300 border-red-500/30',
  CLEANING:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  READY:     'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

export default function RoomCard({ room, onClick }) {
  const colorClass = STATUS_COLORS[room.status] || 'bg-gray-500/20 text-gray-300';

  return (
    <div
      className="room-card select-none"
      onClick={() => onClick && onClick(room)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick(room)}
    >
      {/* Room icon */}
      <div className="w-14 h-14 rounded-2xl bg-brand-600/20 flex items-center justify-center text-brand-400 text-2xl">
        🏠
      </div>

      <h3 className="text-lg font-bold text-white">Room {room.room_number}</h3>

      <span className={`status-badge border ${colorClass}`}>
        {room.status}
      </span>
    </div>
  );
}
