import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  const menu = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/profile', label: 'My Closet', icon: 'person' },
    { path: '/explore', label: 'Explore Marketplace', icon: 'explore' },
    { path: '/swap-request', label: 'Swap Proposals', icon: 'handshake' },
    { path: '/chat', label: 'Negotiations', icon: 'chat' },
    { path: '/notifications', label: 'Notifications', icon: 'notifications' },
    { path: '/settings', label: 'Settings', icon: 'settings' }
  ];

  const activeLink = (path) => location.pathname === path 
    ? 'bg-primary/10 text-primary font-semibold' 
    : 'text-text-secondary hover:bg-primary/5 hover:text-primary';

  return (
    <aside className="w-full md:w-64 bg-white/70 backdrop-blur-md border border-border-custom rounded-2xl p-6 flex flex-col gap-6 h-fit">
      <div className="flex flex-col items-center text-center gap-2">
        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
        <h4 className="font-primary font-bold text-base leading-tight">{user.name}</h4>
        <span className="text-xs text-primary font-bold">🌿 {user.ecoPoints} Eco Points</span>
      </div>

      <nav className="flex flex-col gap-1.5">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${activeLink(item.path)}`}
          >
            <span className="material-symbols-rounded text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {user.isAdmin && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium border border-dashed border-accent/40 mt-4 text-accent-hover hover:bg-accent/5 ${location.pathname === '/admin' ? 'bg-accent/10 font-bold' : ''}`}
          >
            <span className="material-symbols-rounded text-xl">admin_panel_settings</span>
            <span>Admin Control Panel</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}
