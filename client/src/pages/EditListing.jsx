import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Form Fields States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState('Good');
  const [swapValue, setSwapValue] = useState(40);
  const [availability, setAvailability] = useState('available');

  const conditions = ['New with Tags', 'Like New', 'Good', 'Fair'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '9', '10', '32'];

  // Load details
  const { data, isLoading } = useQuery({
    queryKey: ['editListing', id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}`);
      return response.data.listing;
    }
  });

  useEffect(() => {
    if (data) {
      // Verify ownership
      if (data.ownerId._id !== user?.id && !user?.isAdmin) {
        alert('Unauthorized to edit this listing.');
        navigate('/dashboard');
        return;
      }
      setTitle(data.title || '');
      setDescription(data.description || '');
      setSize(data.size || 'M');
      setCondition(data.condition || 'Good');
      setSwapValue(data.swapValue || 40);
      setAvailability(data.availability || 'available');
    }
  }, [data, user]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(`/listings/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      alert('Listing updated successfully!');
      navigate(`/listing/${id}`);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update listing.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      title,
      description,
      size,
      condition,
      swapValue,
      availability
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading details...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-xl">
      <div className="glass-panel p-8 rounded-2xl bg-white/70 flex flex-col gap-6">
        <div>
          <h2 className="font-primary font-bold text-2xl text-text-primary">Edit Listing</h2>
          <p className="text-text-secondary text-xs mt-1">Modify your clothing marketplace parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-bold">Clothing Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              >
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              >
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-bold">Availability State</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
            >
              <option value="available">Available for Swap</option>
              <option value="pending">Pending Swap Resolution</option>
              <option value="swapped">Swapped</option>
              <option value="unavailable">Unavailable / Hidden</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-bold">EcoPoints Value: {swapValue} pts</label>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={swapValue}
              onChange={(e) => setSwapValue(parseInt(e.target.value))}
              className="accent-primary mt-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-bold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary h-24"
              required
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full border border-border-custom py-2.5 rounded-full text-xs font-semibold text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white py-2.5 rounded-full text-xs font-semibold shadow-md"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
