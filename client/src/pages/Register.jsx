import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import LeafletMap from '../components/LeafletMap.jsx';

export default function Register() {
  const { register: registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: 37.7749, lng: -122.4194 }); // default SF coords

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  });

  const handleMapClick = (latLng) => {
    setCoords(latLng);
    setValue('latitude', latLng.lat);
    setValue('longitude', latLng.lng);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');

    const result = await registerUser(data);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setApiError(result.error);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 flex justify-center items-center min-h-[85vh]">
      <div className="glass-panel w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-white/70 animate-fade">
        
        {/* Left Form Column */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-primary font-bold text-2xl text-text-primary">Create Account</h2>
            <p className="text-text-secondary text-xs mt-1">Join slow circular swapping movement</p>
          </div>

          {apiError && (
            <div className="bg-error/10 border border-error/20 text-error text-xs px-4 py-3 rounded-xl mb-4">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-text-secondary font-primary font-bold">Full Name</label>
                <input
                  type="text"
                  placeholder="Elena Rostova"
                  className="w-full px-4 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary transition-all"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <span className="text-[10px] text-error">{errors.name.message}</span>}
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-text-secondary font-primary font-bold">Username</label>
                <input
                  type="text"
                  placeholder="elena_green"
                  className="w-full px-4 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary transition-all"
                  {...register('username', { required: 'Username is required' })}
                />
                {errors.username && <span className="text-[10px] text-error">{errors.username.message}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-text-secondary font-primary font-bold">Email Address</label>
              <input
                type="email"
                placeholder="elena@example.com"
                className="w-full px-4 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary transition-all"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span className="text-[10px] text-error">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-text-secondary font-primary font-bold">Password (min 6 chars)</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary transition-all"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
              {errors.password && <span className="text-[10px] text-error">{errors.password.message}</span>}
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-text-secondary font-primary font-bold">Hub City Name</label>
              <input
                type="text"
                placeholder="San Francisco, CA"
                className="w-full px-4 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary transition-all"
                {...register('locationName', { required: 'Location city is required' })}
              />
              {errors.locationName && <span className="text-[10px] text-error">{errors.locationName.message}</span>}
            </div>

            {/* Hidden coordinates */}
            <input type="hidden" {...register('latitude')} />
            <input type="hidden" {...register('longitude')} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-semibold py-2.5 rounded-full shadow-md mt-4 transition-all flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <span className="material-symbols-rounded animate-spin text-base">sync</span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="text-center mt-4 text-[10px] text-text-secondary">
            <p>Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link></p>
          </div>
        </div>

        {/* Right Map Selector Column */}
        <div className="w-full md:w-1/2 p-6 bg-emerald-950/5 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-border-custom">
          <div>
            <h3 className="font-primary font-bold text-sm text-text-primary">Locate Swapping Center</h3>
            <p className="text-text-secondary text-[10px] mt-0.5">Click on the map to pin your clothing exchange point coordinates</p>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <LeafletMap
              userLocation={[coords.lat, coords.lng]}
              onMapClick={handleMapClick}
              height="320px"
            />
          </div>
          <div className="text-[10px] text-text-secondary text-center">
            Pinned Coordinates: <strong>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
