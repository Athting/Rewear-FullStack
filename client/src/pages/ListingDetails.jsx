import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Dialog from '../components/Dialog.jsx';

export default function ListingDetails() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedMyListingId, setSelectedMyListingId] = useState('');
  const [swapNote, setSwapNote] = useState('');

  // 1. Load details of this listing
  const { data: detailData, isLoading: detailsLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}`);
      return response.data.listing;
    }
  });

  // 2. Load current user's closet (to offer in exchange)
  const { data: myClosetData, isLoading: closetLoading } = useQuery({
    queryKey: ['myCloset'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await api.get(`/listings?ownerId=${currentUser.id}&limit=50`);
      // Filter items belonging to the current user (if query filter is not applied server side)
      return response.data.listings.filter(l => l.ownerId._id === currentUser.id && l.availability === 'available');
    },
    enabled: isAuthenticated
  });

  const myAvailableItems = myClosetData || [];

  // 3. Swap proposal mutation
  const swapMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/swaps', payload);
      return response.data;
    },
    onSuccess: (data) => {
      alert(data.message || 'Swap proposal submitted successfully!');
      setIsSwapModalOpen(false);
      navigate('/chat');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to submit swap proposal.');
    }
  });

  const handleStartSwapSubmit = (e) => {
    e.preventDefault();
    if (!selectedMyListingId) {
      alert('Please select one of your clothing items to offer.');
      return;
    }
    swapMutation.mutate({
      myListingId: selectedMyListingId,
      theirListingId: id,
      note: swapNote
    });
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Navigate directly to chat page (Vite proxy socket handles messaging)
    navigate('/chat');
  };

  if (detailsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background">
        <span className="material-symbols-rounded animate-spin text-primary text-5xl">sync</span>
        <p className="mt-4 font-semibold text-text-secondary">Loading details...</p>
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <span className="material-symbols-rounded text-6xl text-text-secondary">error</span>
        <h2 className="font-primary font-bold text-xl mt-4">Listing Not Found</h2>
        <Link to="/explore" className="btn bg-primary text-white px-6 py-2.5 rounded-full mt-4 inline-block font-semibold">Back to Explore</Link>
      </div>
    );
  }

  const isOwner = detailData.ownerId?._id === currentUser?.id;
  const owner = detailData.ownerId || { name: 'Anonymous', avatar: '', rating: 5 };
  const images = detailData.images || [];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-6">
        <Link to="/explore" className="hover:text-primary">Explore</Link>
        <span className="material-symbols-rounded text-sm">chevron_right</span>
        <span>{detailData.category}</span>
        <span className="material-symbols-rounded text-sm">chevron_right</span>
        <span className="text-text-primary font-semibold truncate">{detailData.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Images Gallery */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-1 rounded-2xl overflow-hidden bg-gray-50 h-[380px] w-full flex items-center justify-center">
            <img
              src={images[activeImageIdx] || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600'}
              alt={detailData.title}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-gray-50 flex-shrink-0 ${activeImageIdx === idx ? 'border-primary shadow-sm' : 'border-transparent'}`}
                >
                  <img src={img} alt="clothing detail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="bg-primary/10 text-primary font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
                {detailData.brand}
              </span>
              <span className="text-primary font-bold text-lg">🌿 {detailData.swapValue} EcoPoints</span>
            </div>
            
            <h1 className="font-primary font-bold text-2xl md:text-3xl text-text-primary leading-tight">
              {detailData.title}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="material-symbols-rounded text-base">location_on</span>
              <span>{detailData.locationName} • Added {new Date(detailData.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold block mb-0.5">Condition</span>
                <span className="font-bold text-sm text-text-primary">{detailData.condition}</span>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold block mb-0.5">Size</span>
                <span className="font-bold text-sm text-text-primary">{detailData.size}</span>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold block mb-0.5">Gender</span>
                <span className="font-bold text-sm text-text-primary">{detailData.gender}</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 border-t border-border-custom pt-4">
              <h3 className="font-primary font-bold text-sm text-text-primary">Description</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{detailData.description}</p>
            </div>

            {/* Actions Buttons */}
            <div className="flex gap-4 mt-4">
              {isOwner ? (
                <Link
                  to={`/edit-listing/${id}`}
                  className="w-full text-center bg-primary hover:bg-primary-hover text-white py-3 rounded-full font-semibold text-sm shadow-md"
                >
                  Edit Listing
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) navigate('/login');
                      else setIsSwapModalOpen(true);
                    }}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-full font-semibold text-sm shadow-md flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-rounded">swap_horiz</span>
                    <span>Propose Swap</span>
                  </button>
                  <button
                    onClick={handleMessage}
                    className="border border-border-custom hover:border-primary text-text-primary hover:text-primary px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-rounded">forum</span>
                    <span>Chat</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Seller profile Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="font-primary font-bold text-sm text-text-primary">Swapper Details</h3>
            <div className="flex items-center gap-4">
              <img src={owner.avatar} alt={owner.name} className="w-12 h-12 rounded-full object-cover border border-border-custom shadow-sm" />
              <div>
                <h4 className="font-bold text-sm text-text-primary leading-tight">{owner.name}</h4>
                <p className="text-xs text-text-secondary">@{owner.username}</p>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span className="material-symbols-rounded text-amber-400 text-sm">star</span>
                  <span className="font-semibold">{owner.rating} Rating</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center border-t border-border-custom pt-3 text-xs text-text-secondary">
              <div>
                <h5 className="font-bold text-text-primary text-sm">{owner.completedSwaps || 0}</h5>
                <p>Swaps</p>
              </div>
              <div>
                <h5 className="font-bold text-text-primary text-sm">🌿 {owner.ecoPoints || 100}</h5>
                <p>Eco Points</p>
              </div>
              <div>
                <h5 className="font-bold text-text-primary text-sm truncate">{detailData.locationName.split(',')[0]}</h5>
                <p>Location</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Propose Swap Wizard Modal */}
      <Dialog isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} title="Offer clothing in exchange">
        <form onSubmit={handleStartSwapSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-text-secondary">
            Select one of your available closet items to offer for <strong>{detailData.title}</strong>:
          </p>

          {myAvailableItems.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto p-1.5">
              {myAvailableItems.map((myI) => (
                <label
                  key={myI._id}
                  className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer hover:bg-primary/5 transition-all ${selectedMyListingId === myI._id ? 'border-primary bg-primary/5' : 'border-border-custom bg-white'}`}
                >
                  <input
                    type="radio"
                    name="my-offered-item"
                    value={myI._id}
                    checked={selectedMyListingId === myI._id}
                    onChange={(e) => setSelectedMyListingId(e.target.value)}
                    className="hidden"
                  />
                  <img src={myI.images?.[0]} alt={myI.title} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-xs text-text-primary truncate">{myI.title}</h4>
                    <p className="text-[10px] text-text-secondary">{myI.brand} • Size {myI.size} • {myI.condition}</p>
                    <span className="text-[10px] text-primary font-bold">🌿 {myI.swapValue} pts</span>
                  </div>
                  <span className="material-symbols-rounded text-primary">
                    {selectedMyListingId === myI._id ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 flex flex-col items-center gap-2">
              <span className="material-symbols-rounded text-4xl text-text-light">wardrobe</span>
              <p className="text-xs text-text-secondary">Your closet is empty or all items are currently swapped.</p>
              <Link to="/create-listing" className="btn bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold mt-2">
                Add New Garment First
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs text-text-secondary font-primary font-bold">Proposal message (optional)</label>
            <textarea
              placeholder="Hi! I love your item and think this garment would fit you well. Let me know if you would like to swap!"
              value={swapNote}
              onChange={(e) => setSwapNote(e.target.value)}
              className="px-4 py-2.5 border border-border-custom rounded-xl text-xs outline-none focus:border-primary h-20"
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button type="button" onClick={() => setIsSwapModalOpen(false)} className="w-full border border-border-custom hover:bg-gray-50 py-2.5 rounded-full text-xs font-semibold text-text-secondary">
              Cancel
            </button>
            <button type="submit" disabled={!selectedMyListingId || swapMutation.isPending} className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white py-2.5 rounded-full text-xs font-semibold shadow-sm">
              {swapMutation.isPending ? 'Sending...' : 'Send Swap Request'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
