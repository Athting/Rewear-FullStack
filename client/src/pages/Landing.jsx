import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import Card from '../components/Card.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load recently posted garments
  const { data, isLoading } = useQuery({
    queryKey: ['landingListings'],
    queryFn: async () => {
      const response = await api.get('/listings?limit=4');
      return response.data;
    }
  });

  const featured = data?.listings || [];

  const impactStats = [
    { value: '18,450+', label: 'Swaps Completed', icon: 'sync' },
    { value: '52.6 Tons', label: 'CO2 Offset', icon: 'co2' },
    { value: '4.8M Liters', label: 'Water Saved', icon: 'water_drop' },
    { value: '345K+', label: 'Eco Points Earned', icon: 'eco' }
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Hero */}
      <section className="container mx-auto px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6 animate-fade">
          <span className="self-start bg-primary/10 text-primary font-semibold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider font-primary">
            🌱 Sustainable Slow Fashion
          </span>
          <h1 className="font-primary font-bold text-4xl md:text-6xl text-text-primary leading-tight tracking-tight">
            Swap Clothes.<br />
            <span className="text-primary">Save Money.</span><br />
            Save the Planet.
          </h1>
          <p className="text-text-secondary text-base md:text-lg leading-relaxed">
            ReWear is an AI-powered circular marketplace where you exchange garments directly. Declutter your closet, discover curated styles, and reduce carbon footprint.
          </p>
          <div className="flex gap-4">
            <Link to="/explore" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-full font-semibold shadow-md flex items-center gap-2">
              <span className="material-symbols-rounded">search</span> Browse Marketplace
            </Link>
            <Link to={isAuthenticated ? '/create-listing' : '/register'} className="border border-primary text-primary hover:bg-primary/5 px-8 py-3.5 rounded-full font-semibold transition-all">
              Start Swapping
            </Link>
          </div>
        </div>

        <div className="relative flex justify-center animate-slide">
          <div className="glass-panel p-2 rounded-3xl max-w-md w-full">
            <img
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800"
              alt="Circular Wardrobe Clothes"
              className="w-full h-[400px] object-cover rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-6 -left-6 bg-white border border-border-custom px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
              <span className="material-symbols-rounded text-primary text-3xl animate-pulse">eco</span>
              <div>
                <h5 className="font-primary font-bold text-sm">Circular Wardrobe</h5>
                <p className="text-text-secondary text-[11px]">100% Carbon-Neutral Matches</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white border-y border-border-custom py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-xl mx-auto mb-12">
            <h2 className="font-primary font-bold text-3xl mb-3">How ReWear Works</h2>
            <p className="text-text-secondary">AI-assisted clothing exchanges in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl relative flex flex-col items-center">
              <span className="absolute -top-4 w-10 h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center font-primary">1</span>
              <span className="material-symbols-rounded text-primary text-5xl mb-4 mt-2">add_photo_alternate</span>
              <h3 className="font-primary font-bold text-lg mb-2">Upload Clothes</h3>
              <p className="text-text-secondary text-sm">Take a photo. Our Google Gemini AI vision generates listing details, condition estimates, and tags automatically.</p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl relative flex flex-col items-center">
              <span className="absolute -top-4 w-10 h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center font-primary">2</span>
              <span className="material-symbols-rounded text-primary text-5xl mb-4 mt-2">handshake</span>
              <h3 className="font-primary font-bold text-lg mb-2">Match & Propose</h3>
              <p className="text-text-secondary text-sm">Browse closets nearby. Swap request score indicators calculate fairness. Settle points differences through chat.</p>
            </div>

            <div className="glass-panel p-8 rounded-2xl relative flex flex-col items-center">
              <span className="absolute -top-4 w-10 h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center font-primary">3</span>
              <span className="material-symbols-rounded text-primary text-5xl mb-4 mt-2">local_shipping</span>
              <h3 className="font-primary font-bold text-lg mb-2">Swap & Earn</h3>
              <p className="text-text-secondary text-sm">Meet up locally or ship the item. Complete exchanges to earn bonus Eco Points and unlock premium wardrobe slots.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-primary font-bold text-3xl mb-2">Recent Listings</h2>
            <p className="text-text-secondary text-sm">Garments recently listed in your region</p>
          </div>
          <Link to="/explore" className="text-primary font-semibold flex items-center gap-1 hover:underline">
            View All <span className="material-symbols-rounded">arrow_forward</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-skeleton rounded-2xl"></div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {featured.map((item) => (
              <Card key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">No listings available currently. Be the first to post!</div>
        )}
      </section>

      {/* Environmental Impact Statistics */}
      <section className="bg-emerald-950 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-primary font-bold text-3xl mb-12">Our Platform Sustainability Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {impactStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="material-symbols-rounded text-3xl text-secondary">{stat.icon}</span>
                <h3 className="font-primary font-bold text-3xl text-secondary">{stat.value}</h3>
                <p className="text-sm text-gray-300 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
