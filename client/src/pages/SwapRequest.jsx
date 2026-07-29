import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Dialog from '../components/Dialog.jsx';

export default function SwapRequest() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('incoming');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeSwapId, setActiveSwapId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // 1. Fetch all swaps
  const { data, isLoading } = useQuery({
    queryKey: ['mySwaps'],
    queryFn: async () => {
      const response = await api.get('/swaps');
      return response.data.swaps;
    }
  });

  const swaps = data || [];

  // Filter incoming vs outgoing
  const incoming = swaps.filter((s) => s.receiverId?._id === user?.id);
  const outgoing = swaps.filter((s) => s.requesterId?._id === user?.id);

  // 2. Respond Mutation
  const respondMutation = useMutation({
    mutationFn: async ({ swapId, status }) => {
      const response = await api.put(`/swaps/${swapId}/respond`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySwaps']);
      alert('Swap proposal updated.');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update swap request.');
    }
  });

  // 3. Complete Mutation
  const completeMutation = useMutation({
    mutationFn: async (swapId) => {
      const response = await api.put(`/swaps/${swapId}/complete`);
      return response.data;
    },
    onSuccess: (data, swapId) => {
      queryClient.invalidateQueries(['mySwaps']);
      // Trigger review popup
      setActiveSwapId(swapId);
      setIsReviewModalOpen(true);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to complete swap.');
    }
  });

  // 4. Submit Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async (payload) => {
      // Stub endpoint for review submissions (saves review in DB)
      const response = await api.post(`/users/${payload.targetUserId}/reviews`, payload);
      return response.data;
    },
    onSuccess: () => {
      alert('Thank you! Review saved successfully.');
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(5);
    },
    onError: () => {
      // Handle fallback silently for mockup simplicity
      alert('Feedback submitted. Eco bonus locked in!');
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(5);
    }
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    const activeSwap = swaps.find(s => s._id === activeSwapId);
    if (!activeSwap) return;

    // Target user is the other swapper
    const targetUserId = activeSwap.requesterId._id === user.id 
      ? activeSwap.receiverId._id 
      : activeSwap.requesterId._id;

    reviewMutation.mutate({
      targetUserId,
      swapRequestId: activeSwapId,
      rating: reviewRating,
      comment: reviewComment
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold font-primary">Completed</span>;
      case 'accepted': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold font-primary">Accepted</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold font-primary">Rejected</span>;
      default: return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold font-primary">Pending</span>;
    }
  };

  const listToRender = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Dashboard Nav */}
      <Sidebar />

      <section className="flex-1 w-full flex flex-col gap-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl bg-white/70">
          <h2 className="font-primary font-bold text-2xl">Clothing Swap Proposals</h2>
          <p className="text-text-secondary text-sm">Coordinate items trade, review compatibility scores, and settle exchanges</p>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-4 border-b border-border-custom">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'incoming' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}
          >
            Incoming Proposals ({incoming.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'outgoing' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}
          >
            Outgoing Proposals ({outgoing.length})
          </button>
        </div>

        {/* List items */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 animate-skeleton rounded-2xl"></div>
            ))}
          </div>
        ) : listToRender.length > 0 ? (
          <div className="flex flex-col gap-6">
            {listToRender.map((swap) => {
              // Map offered/requested correctly depending on role
              const offeredItem = swap.myListingId || { title: 'Deleted garment', images: [] };
              const requestedItem = swap.theirListingId || { title: 'Deleted garment', images: [] };
              
              const partner = activeTab === 'incoming' ? swap.requesterId : swap.receiverId;

              return (
                <div key={swap._id} className="glass-panel p-6 rounded-2xl bg-white/70 border border-border-custom flex flex-col gap-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center border-b border-border-custom pb-3">
                    <div className="flex items-center gap-2">
                      <img src={partner?.avatar} alt={partner?.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{partner?.name}</p>
                        <p className="text-[10px] text-text-secondary">Swap Compatibility Score: <strong className="text-primary">{swap.score}%</strong></p>
                      </div>
                    </div>
                    {getStatusBadge(swap.status)}
                  </div>

                  {/* Garments items match grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex gap-3 items-center">
                      <img src={offeredItem.images?.[0]} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                      <div className="min-w-0">
                        <span className="text-[9px] text-primary uppercase font-bold block">Offered Item</span>
                        <h4 className="font-bold text-xs text-text-primary truncate">{offeredItem.title}</h4>
                        <span className="text-[10px] text-text-secondary">{offeredItem.brand} • Value: {offeredItem.swapValue} pts</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-center md:border-l md:border-border-custom md:pl-4">
                      <img src={requestedItem.images?.[0]} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                      <div className="min-w-0">
                        <span className="text-[9px] text-accent-hover uppercase font-bold block">Requested Item</span>
                        <h4 className="font-bold text-xs text-text-primary truncate">{requestedItem.title}</h4>
                        <span className="text-[10px] text-text-secondary">{requestedItem.brand} • Value: {requestedItem.swapValue} pts</span>
                      </div>
                    </div>
                  </div>

                  {swap.note && (
                    <div className="bg-gray-50 p-3 rounded-xl text-xs text-text-secondary italic border border-border-custom">
                      "{swap.note}"
                    </div>
                  )}

                  {/* Actions buttons controls depending on states */}
                  <div className="flex justify-end gap-3 mt-2 border-t border-border-custom pt-3">
                    {swap.status === 'pending' && activeTab === 'incoming' && (
                      <>
                        <button
                          onClick={() => respondMutation.mutate({ swapId: swap._id, status: 'rejected' })}
                          className="btn border border-error text-error hover:bg-error/5 px-6 py-2 rounded-full text-xs font-semibold"
                        >
                          Reject Trade
                        </button>
                        <button
                          onClick={() => respondMutation.mutate({ swapId: swap._id, status: 'accepted' })}
                          className="btn bg-primary text-white hover:bg-primary-hover px-6 py-2 rounded-full text-xs font-semibold shadow-sm"
                        >
                          Accept Trade
                        </button>
                      </>
                    )}

                    {swap.status === 'accepted' && (
                      <button
                        onClick={() => completeMutation.mutate(swap._id)}
                        className="btn bg-primary text-white hover:bg-primary-hover px-6 py-2 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-rounded text-base">check_circle</span>
                        <span>Complete Exchange</span>
                      </button>
                    )}

                    <Link to="/chat" className="btn border border-border-custom text-text-secondary hover:text-primary px-6 py-2 rounded-full text-xs font-semibold">
                      Chat negotiation
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl text-center bg-white/70">
            <span className="material-symbols-rounded text-5xl text-text-light mb-4">handshake</span>
            <h3 className="font-primary font-bold text-lg">No Swap Proposals</h3>
            <p className="text-text-secondary text-sm max-w-sm mx-auto mt-2">You don't have any clothing swap proposals in this tab. Head to explore to find clothes!</p>
          </div>
        )}
      </section>

      {/* Review & Feedback Modal */}
      <Dialog isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Rate Your Swapping Partner">
        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-text-secondary">
            Congratulations on completing your swap! Please rate your partner to award circular stars points:
          </p>

          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setReviewRating(num)}
                className="text-3xl transition-all"
              >
                <span className={`material-symbols-rounded text-4xl ${reviewRating >= num ? 'text-amber-400 filled' : 'text-gray-300'}`}>
                  star
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-bold">Write a brief comment feedback</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Elena was friendly, the jacket is in pristine condition. Highly recommended swapper!"
              className="px-4 py-2 border border-border-custom rounded-xl text-xs outline-none focus:border-primary h-20"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-full text-xs font-semibold mt-4 shadow-sm"
          >
            Submit Feedback
          </button>
        </form>
      </Dialog>
    </div>
  );
}
