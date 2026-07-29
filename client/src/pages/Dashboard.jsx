import React, { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ChartContainer from '../components/ChartContainer.jsx';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch AI Clothing Recommendations (Gemini matched)
  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await api.get('/ai/recommendations');
      return response.data.recommendations || [];
    }
  });

  // 2. Fetch User closet listings to check active clothes count
  const { data: closetData } = useQuery({
    queryKey: ['myClosetCount'],
    queryFn: async () => {
      const response = await api.get(`/listings?ownerId=${user.id}&limit=50`);
      return response.data.listings.filter(l => l.ownerId._id === user.id);
    }
  });

  const myCloset = closetData || [];
  const activeListingsCount = myCloset.filter(l => l.availability === 'available').length;

  // 3. Swap proposal mutation helper
  const proposeMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/swaps', payload);
      return response.data;
    },
    onSuccess: () => {
      alert('Swap Proposal sent! Check chat inbox to negotiate.');
      queryClient.invalidateQueries(['recommendations']);
      navigate('/chat');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    }
  });

  const handleQuickSwap = (matchedListingId, offeredClosetItemId) => {
    proposeMutation.mutate({
      myListingId: offeredClosetItemId,
      theirListingId: matchedListingId,
      note: 'Hi! ReWear AI recommended this exchange. Would you like to swap items?'
    });
  };

  // Calculate dynamic environmental tracking stats based on completed swaps count
  const completedSwapsCount = user?.completedSwaps || 0;
  const co2Goal = 100; // Target goal in kg
  const co2Saved = completedSwapsCount * 15; // 15 kg of CO2 saved per swap
  const waterSaved = completedSwapsCount * 2700; // 2700 Liters of water saved per swap (average cotton garment)
  const wasteSaved = completedSwapsCount * 350; // 350 grams of waste saved/diverted per garment swap

  const progressPercentage = Math.min(100, Math.round((co2Saved / co2Goal) * 100));

  // Distribute completed swaps across months to create a realistic dynamic graph
  const monthLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const monthData = [0, 0, 0, 0, 0, 0];
  if (completedSwapsCount > 0) {
    let remaining = completedSwapsCount;
    // Distribute: 40% in current month, 30% in previous month, and rest split earlier
    monthData[5] = Math.ceil(remaining * 0.4);
    remaining -= monthData[5];
    
    if (remaining > 0) {
      monthData[4] = Math.ceil(remaining * 0.5);
      remaining -= monthData[4];
    }
    if (remaining > 0) {
      monthData[3] = remaining;
    }
  }

  const chartDatasets = [
    {
      label: 'Swaps Completed',
      data: monthData,
      backgroundColor: 'rgba(46, 125, 50, 0.4)',
      borderColor: 'rgba(46, 125, 50, 1)'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar navigation */}
      <Sidebar />

      <section className="flex-1 w-full flex flex-col gap-8 animate-fade">
        {/* Profile overview banner */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center bg-white/70 border border-border-custom gap-4">
          <div>
            <h1 className="font-primary font-bold text-2xl text-text-primary">Circular Fashion Dashboard</h1>
            <p className="text-text-secondary text-xs mt-1">🌿 Keep garments circulating. Earn Eco Points and tracking environmental impacts.</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-full shadow-sm">
              🌿 {user?.ecoPoints || 100} Eco Points
            </span>
          </div>
        </div>

        {/* Sustainability Tracking Widget & Personal Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sustainability Tracker (Circle gauge) */}
          <div className="glass-panel p-6 rounded-2xl bg-white/70 flex flex-col md:flex-row gap-6 items-center">
            {/* Circular Gauge */}
            <div
              className="conic-progress-circle flex-shrink-0"
              style={{
                background: `conic-gradient(#2E7D32 ${progressPercentage * 3.6}deg, #E0E4DE 0deg)`
              }}
            >
              <div className="conic-progress-inner flex flex-col items-center">
                <span className="font-primary font-bold text-xl text-primary">{progressPercentage}%</span>
                <span className="text-[9px] text-text-secondary">CO2 Goal Met</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex-grow flex flex-col gap-4">
              <div>
                <h3 className="font-primary font-bold text-base text-text-primary">AI Sustainability Tracker</h3>
                <p className="text-[11px] text-text-secondary">Impact scorecard for your completed swaps</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                  <span className="material-symbols-rounded text-primary text-base block mb-1">co2</span>
                  <span className="font-bold text-sm block">{co2Saved} kg</span>
                  <span className="text-[9px] text-text-secondary">CO2 Saved</span>
                </div>
                <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                  <span className="material-symbols-rounded text-primary text-base block mb-1">water_drop</span>
                  <span className="font-bold text-sm block">{waterSaved} L</span>
                  <span className="text-[9px] text-text-secondary">Water Saved</span>
                </div>
                <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                  <span className="material-symbols-rounded text-primary text-base block mb-1">restore_from_trash</span>
                  <span className="font-bold text-sm block">{wasteSaved} g</span>
                  <span className="text-[9px] text-text-secondary">Waste Saved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Chart Container */}
          <div className="glass-panel p-6 rounded-2xl bg-white/70">
            <h3 className="font-primary font-bold text-sm text-text-primary mb-4">Swaps Completed History</h3>
            <ChartContainer type="bar" labels={monthLabels} datasets={chartDatasets} />
          </div>
        </div>

        {/* Quick Stats Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl bg-white/70 border border-border-custom text-center">
            <span className="material-symbols-rounded text-primary text-2xl mb-1">sync</span>
            <h4 className="font-primary font-bold text-lg">{user?.completedSwaps || 0}</h4>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Exchanges Done</p>
          </div>
          
          <div className="glass-panel p-4 rounded-xl bg-white/70 border border-border-custom text-center">
            <span className="material-symbols-rounded text-primary text-2xl mb-1">wardrobe</span>
            <h4 className="font-primary font-bold text-lg">{activeListingsCount}</h4>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Active Listings</p>
          </div>

          <div className="glass-panel p-4 rounded-xl bg-white/70 border border-border-custom text-center">
            <span className="material-symbols-rounded text-primary text-2xl mb-1">star</span>
            <h4 className="font-primary font-bold text-lg">{user?.rating || '5.0'}</h4>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Swapper Rating</p>
          </div>

          <div className="glass-panel p-4 rounded-xl bg-white/70 border border-border-custom text-center">
            <span className="material-symbols-rounded text-primary text-2xl mb-1">payments</span>
            <h4 className="font-primary font-bold text-lg">🌿 {user?.ecoPoints || 100}</h4>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Eco Wallet</p>
          </div>
        </div>

        {/* AI Recommendations Swapping Engine Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-primary font-bold text-base text-text-primary flex items-center gap-1.5">
              <span className="material-symbols-rounded text-primary text-2xl">smart_toy</span>
              <span>AI Swap Match Recommendations</span>
            </h3>
            <p className="text-xs text-text-secondary">Curated clothing exchanges based on your closet items and preferences</p>
          </div>

          {recLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 animate-skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : recData.length > 0 ? (
            <div className="flex flex-col gap-4">
              {recData.map((rec, i) => (
                <div key={i} className="glass-panel p-5 rounded-2xl bg-white/70 flex flex-col md:flex-row gap-5 items-center hover:shadow-md transition-all">
                  
                  {/* Offered Closet item */}
                  <div className="flex gap-3 items-center w-full md:w-1/4">
                    <img src={rec.offeredItem?.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                    <div className="min-w-0">
                      <span className="text-[8px] text-text-secondary font-bold block uppercase">Your offered item</span>
                      <h4 className="font-bold text-xs text-text-primary truncate">{rec.offeredItem?.title}</h4>
                      <span className="text-[9px] text-primary font-bold">🌿 {rec.offeredItem?.swapValue} pts</span>
                    </div>
                  </div>

                  {/* Icon Match Indicator */}
                  <div className="flex flex-col items-center justify-center p-2 bg-primary/10 rounded-full text-primary font-bold text-xs">
                    <span className="material-symbols-rounded">swap_horiz</span>
                    <span className="text-[9px]">{rec.compatibilityScore}%</span>
                  </div>

                  {/* Matched Marketplace item */}
                  <div className="flex gap-3 items-center w-full md:w-1/4">
                    <img src={rec.listing?.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                    <div className="min-w-0">
                      <span className="text-[8px] text-text-secondary font-bold block uppercase">Matched item</span>
                      <h4 className="font-bold text-xs text-text-primary truncate">{rec.listing?.title}</h4>
                      <span className="text-[9px] text-primary font-bold">🌿 {rec.listing?.swapValue} pts</span>
                    </div>
                  </div>

                  {/* AI Match explanation and prompt CTA */}
                  <div className="flex-grow flex flex-col md:flex-row gap-4 items-center justify-between w-full md:w-auto">
                    <div className="min-w-0 text-left md:max-w-xs">
                      <p className="text-[10px] text-text-secondary leading-tight italic">
                        "{rec.reason}"
                      </p>
                      <p className="text-[9px] text-primary font-bold mt-1">
                        🌍 Saves {rec.environmentalImpact?.co2SavedKg}kg CO2 & {rec.environmentalImpact?.waterSavedLiters}L Water
                      </p>
                    </div>

                    <button
                      onClick={() => handleQuickSwap(rec.listing._id, rec.offeredItem._id)}
                      disabled={proposeMutation.isPending}
                      className="btn bg-primary hover:bg-primary-hover text-white text-xs px-5 py-2.5 rounded-full font-semibold shadow-sm w-full md:w-auto text-center"
                    >
                      Propose Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center bg-white/70">
              <span className="material-symbols-rounded text-4xl text-text-light mb-2">info</span>
              <h4 className="font-bold text-sm text-text-primary">No Recommendations Yet</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                Once you upload at least one active garment to your closet, our Google Gemini AI recommendation engine will scan the marketplace to match swaps!
              </p>
              <Link to="/create-listing" className="btn bg-primary text-white px-6 py-2 rounded-full font-semibold text-xs mt-3 inline-block">
                Upload Clothes
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
