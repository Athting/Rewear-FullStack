import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');

    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setApiError(result.error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-12">
      <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-xl p-8 bg-white/70 animate-fade">
        <div className="text-center mb-8">
          <h2 className="font-primary font-bold text-3xl text-text-primary">Welcome Back</h2>
          <p className="text-text-secondary text-sm mt-2">Log in to coordinate swaps and browse closets</p>
        </div>

        {apiError && (
          <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl mb-6">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-primary font-bold">Email Address</label>
            <div className="relative flex items-center">
              <span className="material-symbols-rounded absolute left-4 text-text-secondary">mail</span>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full pl-12 pr-4 py-3 border border-border-custom bg-white/80 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>
            {errors.email && <span className="text-xs text-error mt-0.5">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-primary font-bold">Password</label>
            <div className="relative flex items-center">
              <span className="material-symbols-rounded absolute left-4 text-text-secondary">lock</span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 border border-border-custom bg-white/80 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && <span className="text-xs text-error mt-0.5">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-semibold py-3 rounded-full shadow-md mt-4 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-rounded animate-spin text-xl">sync</span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-text-secondary">
          <p>Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}
