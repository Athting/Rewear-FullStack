import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import LeafletMap from '../components/LeafletMap.jsx';

export default function Settings() {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile States
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [locationName, setLocationName] = useState(user?.locationName || '');
  
  const userCoords = user?.locationCoordinates?.coordinates || [-122.4194, 37.7749];
  const [longitude, setLongitude] = useState(userCoords[0]);
  const [latitude, setLatitude] = useState(userCoords[1]);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);

  // 1. Update Details Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await updateProfile(payload);
      return response;
    },
    onSuccess: (res) => {
      if (res.success) alert('Profile updated successfully!');
      else alert(res.error || 'Failed to update profile.');
    }
  });

  const handleSubmitDetails = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      bio,
      locationName,
      longitude,
      latitude
    });
  };

  // 2. Avatar upload handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    // Proactively upload immediately
    uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message || 'Avatar updated!');
    } catch (error) {
      alert(error.response?.data?.message || 'Avatar upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // 3. Delete Account Handler
  const handleDeleteAccount = async () => {
    const confirm = window.confirm('Are you absolutely sure you want to delete your ReWear account? This will permanently erase your clothes, swap history, and EcoPoints. This action CANNOT be undone.');
    if (confirm) {
      try {
        await api.delete('/users/delete');
        alert('Your ReWear account was successfully deleted. Sorry to see you go!');
        await logout();
        navigate('/');
      } catch (error) {
        alert('Failed to delete account.');
      }
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar navigation */}
      <Sidebar />

      <section className="flex-1 w-full flex flex-col gap-6 animate-fade">
        <div className="glass-panel p-6 rounded-2xl bg-white/70">
          <h2 className="font-primary font-bold text-2xl">Account Settings</h2>
          <p className="text-text-secondary text-sm">Update credentials, profile descriptions, and swap location points</p>
        </div>

        {/* Profile photo block */}
        <div className="glass-panel p-6 rounded-2xl bg-white/70 flex flex-col md:flex-row gap-6 items-center border border-border-custom">
          <div className="relative">
            <img src={avatarPreview} alt={name} className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md bg-white" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-rounded animate-spin">sync</span>
              </div>
            )}
          </div>
          <div className="flex-grow flex flex-col gap-2">
            <h4 className="font-bold text-sm text-text-primary">Profile Picture</h4>
            <p className="text-xs text-text-secondary">PNG, JPG formats accepted. Automatically syncs with Cloudinary servers.</p>
            <label className="btn bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-full text-xs font-semibold w-fit cursor-pointer transition-all">
              Choose New Photo
              <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </label>
          </div>
        </div>

        {/* Details Form block */}
        <div className="glass-panel p-6 rounded-2xl bg-white/70 border border-border-custom">
          <form onSubmit={handleSubmitDetails} className="flex flex-col gap-4">
            <h3 className="font-primary font-bold text-sm text-text-primary border-b border-border-custom pb-2">Profile Specifications</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-2 border border-border-custom rounded-xl text-xs bg-white outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Biography (Bio)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="px-4 py-2 border border-border-custom rounded-xl text-xs bg-white outline-none focus:border-primary h-20"
                required
              />
            </div>

            <h3 className="font-primary font-bold text-sm text-text-primary border-b border-border-custom pb-2 mt-4">Swap Hub Location</h3>
            <p className="text-[10px] text-text-secondary -mt-2">Re-verify coordinates where you transact swapped garments</p>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Hub City Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="px-4 py-2 border border-border-custom rounded-xl text-xs bg-white outline-none focus:border-primary"
                required
              />
            </div>

            <div className="h-64 rounded-xl overflow-hidden border border-border-custom">
              <LeafletMap
                userLocation={[latitude, longitude]}
                onMapClick={(latLng) => {
                  setLatitude(latLng.lat);
                  setLongitude(latLng.lng);
                }}
                height="250px"
              />
            </div>

            <div className="text-[10px] text-text-secondary text-center">
              Coordinates: <strong>{latitude.toFixed(5)}, {longitude.toFixed(5)}</strong>
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-full text-xs font-semibold mt-4 shadow-sm"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Delete Account block */}
        <div className="glass-panel p-6 rounded-2xl bg-red-50/20 border border-red-200/50 flex justify-between items-center">
          <div>
            <h4 className="font-primary font-bold text-sm text-error">Danger Zone</h4>
            <p className="text-text-secondary text-[11px] mt-0.5">Permanently delete your account and all swap listings</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="btn bg-error hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-sm"
          >
            Delete Account
          </button>
        </div>

      </section>
    </div>
  );
}
