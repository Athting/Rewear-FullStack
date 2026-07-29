import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Card from '../components/Card.jsx';

export default function Profile() {
  const { user } = useContext(AuthContext);

  // 1. Fetch user's listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const response = await api.get(`/listings?ownerId=${user.id}&limit=50`);
      // Filter items belonging to the current user (if query filter is not applied server side)
      return response.data.listings.filter(l => l.ownerId._id === user.id);
    }
  });

  const myListings = listingsData || [];
  const activeItems = myListings.filter(l => l.availability === 'available');
  const pendingItems = myListings.filter(l => l.availability === 'pending');
  const swappedItems = myListings.filter(l => l.availability === 'swapped');

  // Mock swappers reviews
  const mockReviews = [
    { reviewer: { name: 'Elena Rostova', avatar: 'https://ui-avatars.com/api/?name=Elena' }, rating: 5, comment: 'The fleece jacket was in perfect condition. Friendly swap!' },
    { reviewer: { name: 'Marcus Brody', avatar: 'https://ui-avatars.com/api/?name=Marcus' }, rating: 4.8, comment: 'Clean exchange, met up in city hub. Will swap again!' }
  ];

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar navigation */}
      <Sidebar />

      <section className="flex-1 w-full flex flex-col gap-8 animate-fade">
        {/* Profile Card Header */}
        <div className="glass-panel rounded-2xl bg-white/70 overflow-hidden relative border border-border-custom">
          {/* Cover */}
          <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${user?.cover || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800'})` }}></div>
          
          <div className="p-6 relative flex flex-col md:flex-row gap-6 items-start md:items-end -mt-10">
            <img src={user?.avatar} alt={user?.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white flex-shrink-0" />
            <div className="flex-grow">
              <h2 className="font-primary font-bold text-2xl text-text-primary leading-tight">{user?.name}</h2>
              <p className="text-xs text-text-secondary">@{user?.username} • Hub: {user?.locationName}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="font-semibold text-primary">🌿 {user?.ecoPoints || 100} Eco Points</span>
                <span className="text-text-secondary">•</span>
                <span className="font-semibold text-amber-500 flex items-center gap-0.5">
                  <span className="material-symbols-rounded text-sm">star</span> {user?.rating || '5.0'} Rating
                </span>
                <span className="text-text-secondary">•</span>
                <span className="font-semibold text-text-primary">{user?.completedSwaps || 0} Swaps Completed</span>
              </div>
            </div>
            <Link to="/settings" className="btn border border-border-custom hover:border-primary text-text-primary hover:text-primary px-5 py-2 rounded-full text-xs font-semibold self-start md:self-end transition-all">
              Edit Profile
            </Link>
          </div>

          <div className="px-6 pb-6 pt-2 border-t border-border-custom bg-gray-50/50">
            <p className="text-xs text-text-secondary leading-relaxed"><strong className="text-text-primary">Bio:</strong> {user?.bio}</p>
          </div>
        </div>

        {/* Listings Tabs */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-primary font-bold text-lg">My Closet ({myListings.length})</h3>
            <Link to="/create-listing" className="btn bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
              <span className="material-symbols-rounded text-sm">add</span> Add Garment
            </Link>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 animate-skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : myListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((item) => (
                <div key={item._id} className="relative">
                  <Card item={item} />
                  {/* Status Overlay indicator */}
                  {item.availability !== 'available' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl pointer-events-none z-10">
                      <span className="bg-white/90 text-text-primary font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                        {item.availability}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl text-center bg-white/70">
              <span className="material-symbols-rounded text-5xl text-text-light mb-4">wardrobe</span>
              <h4 className="font-primary font-bold text-base">Your closet is empty!</h4>
              <p className="text-text-secondary text-xs max-w-xs mx-auto mt-2">List clothes you no longer wear to start exchanging them with others.</p>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="flex flex-col gap-4">
          <h3 className="font-primary font-bold text-lg">Swapper Reviews</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockReviews.map((rev, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-xl bg-white/70 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <img src={rev.reviewer.avatar} alt={rev.reviewer.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <h5 className="font-bold text-xs text-text-primary leading-tight">{rev.reviewer.name}</h5>
                    <div className="flex items-center gap-0.5 text-xs mt-0.5">
                      <span className="material-symbols-rounded text-amber-400 text-sm">star</span>
                      <span className="font-semibold text-[10px]">{rev.rating}</span>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary text-xs italic leading-relaxed">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
