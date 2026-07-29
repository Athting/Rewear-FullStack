import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { SocketContext } from '../context/SocketContext.jsx';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { liveNotifications } = useContext(SocketContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLink = (path) => location.pathname === path ? 'text-primary font-semibold' : 'text-text-secondary hover:text-primary';

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[74px] bg-white/80 backdrop-blur-md border-b border-border-custom z-50 flex items-center">
      <div className="container mx-auto px-6 flex justify-between items-center w-full">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <span className="material-symbols-rounded text-primary text-3xl">eco</span>
          <span className="font-primary font-bold text-xl tracking-tight text-primary">ReWear</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={activeLink('/')}>Home</Link>
          <Link to="/explore" className={activeLink('/explore')}>Explore</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className={activeLink('/dashboard')}>Dashboard</Link>
          )}
          {isAuthenticated && user?.isAdmin && (
            <Link to="/admin" className={activeLink('/admin')}>Admin</Link>
          )}
        </div>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Notifications Inbox */}
              <Link to="/notifications" className="relative p-2 text-text-secondary hover:text-primary transition-all">
                <span className="material-symbols-rounded text-2xl">notifications</span>
                {liveNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 bg-error text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {liveNotifications.length}
                  </span>
                )}
              </Link>

              {/* Chat Inbox */}
              <Link to="/chat" className="relative p-2 text-text-secondary hover:text-primary transition-all">
                <span className="material-symbols-rounded text-2xl">forum</span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 border border-border-custom rounded-full hover:shadow-md transition-all"
                >
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  <span className="font-semibold text-sm max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <span className="material-symbols-rounded">arrow_drop_down</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-white border border-border-custom rounded-xl shadow-lg p-2 flex flex-col gap-1">
                    <div className="px-3 py-2">
                      <p className="font-bold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-primary font-semibold">🌿 {user.ecoPoints} Eco Points</p>
                    </div>
                    <div className="h-[1px] bg-border-custom my-1"></div>
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary" onClick={() => setDropdownOpen(false)}>
                      <span className="material-symbols-rounded text-lg">person</span> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary" onClick={() => setDropdownOpen(false)}>
                      <span className="material-symbols-rounded text-lg">settings</span> Settings
                    </Link>
                    <div className="h-[1px] bg-border-custom my-1"></div>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-error/10 text-error w-full text-left">
                      <span className="material-symbols-rounded text-lg">logout</span> Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Swap CTA */}
              <Link to="/create-listing" className="btn bg-primary text-white hover:bg-primary-hover px-5 py-2 font-medium rounded-full text-sm flex items-center gap-1 shadow-sm">
                <span className="material-symbols-rounded text-lg">add</span>
                <span>Swap Clothes</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-text-secondary hover:text-primary font-medium text-sm">Login</Link>
              <Link to="/register" className="btn bg-primary text-white hover:bg-primary-hover px-5 py-2 font-medium rounded-full text-sm shadow-sm">Register</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span className="material-symbols-rounded text-3xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[74px] left-0 right-0 bg-white border-b border-border-custom p-6 shadow-lg flex flex-col gap-4 md:hidden animate-slide">
          <Link to="/" className={activeLink('/')} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/explore" className={activeLink('/explore')} onClick={() => setMobileMenuOpen(false)}>Explore</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={activeLink('/dashboard')} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              {user?.isAdmin && (
                <Link to="/admin" className={activeLink('/admin')} onClick={() => setMobileMenuOpen(false)}>Admin</Link>
              )}
              <Link to="/profile" className="text-text-secondary" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
              <Link to="/notifications" className="text-text-secondary" onClick={() => setMobileMenuOpen(false)}>
                Notifications ({liveNotifications.length})
              </Link>
              <Link to="/chat" className="text-text-secondary" onClick={() => setMobileMenuOpen(false)}>Chats</Link>
              <Link to="/settings" className="text-text-secondary" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
              <div className="h-[1px] bg-border-custom my-1"></div>
              <Link to="/create-listing" className="btn bg-primary text-white text-center py-2.5 rounded-full font-medium" onClick={() => setMobileMenuOpen(false)}>
                Swap Clothes
              </Link>
              <button onClick={handleLogout} className="btn border border-error text-error text-center py-2.5 rounded-full font-medium w-full">
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link to="/login" className="btn border border-border-custom text-center py-2.5 rounded-full font-medium" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn bg-primary text-white text-center py-2.5 rounded-full font-medium" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
