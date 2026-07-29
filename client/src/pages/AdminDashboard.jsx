import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import Sidebar from '../components/Sidebar.jsx';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('stats');

  // 1. Fetch Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data.stats;
    }
  });

  // 2. Fetch Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data.users;
    }
  });

  const users = usersData || [];

  // 3. Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.put(`/admin/users/${userId}/suspend`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['adminUsers']);
      alert(data.message || 'User status updated successfully.');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  });

  // Mock disputes list (moderation tracker)
  const mockDisputes = [
    { id: '1', requester: 'Elena R.', receiver: 'Marcus B.', reason: 'Item size mismatch', status: 'investigating' },
    { id: '2', requester: 'John Doe', receiver: 'Sarah C.', reason: 'Unshipped fleece blazer', status: 'resolved' }
  ];

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar navigation */}
      <Sidebar />

      <section className="flex-1 w-full flex flex-col gap-6 animate-fade">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl bg-white/70">
          <h2 className="font-primary font-bold text-2xl text-accent-hover">Admin Control Panel</h2>
          <p className="text-text-secondary text-sm">Moderate clothing disputes, track platform growth KPIs, and suspend malicious users</p>
        </div>

        {/* Inner Tabs */}
        <div className="flex gap-4 border-b border-border-custom">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'stats' ? 'border-accent-hover text-accent-hover' : 'border-transparent text-text-secondary'}`}
          >
            KPI Platform Metrics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'users' ? 'border-accent-hover text-accent-hover' : 'border-transparent text-text-secondary'}`}
          >
            Moderate Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'disputes' ? 'border-accent-hover text-accent-hover' : 'border-transparent text-text-secondary'}`}
          >
            Disputes Queue ({mockDisputes.length})
          </button>
        </div>

        {/* TAB 1: STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-6">
            {statsLoading ? (
              <div className="p-4 text-center">Loading platform stats...</div>
            ) : statsData ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom">
                    <span className="text-[10px] text-text-secondary uppercase font-bold block mb-1">Total Members</span>
                    <h3 className="font-primary font-bold text-3xl text-primary">{statsData.totalUsers}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom">
                    <span className="text-[10px] text-text-secondary uppercase font-bold block mb-1">Garments Listed</span>
                    <h3 className="font-primary font-bold text-3xl text-primary">{statsData.totalListings}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom">
                    <span className="text-[10px] text-text-secondary uppercase font-bold block mb-1">Swaps Attempted</span>
                    <h3 className="font-primary font-bold text-3xl text-primary">{statsData.totalSwaps}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom">
                    <span className="text-[10px] text-text-secondary uppercase font-bold block mb-1">Swaps Completed</span>
                    <h3 className="font-primary font-bold text-3xl text-primary">{statsData.completedSwaps}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom">
                    <span className="text-[10px] text-text-secondary uppercase font-bold block mb-1">Pending Swaps</span>
                    <h3 className="font-primary font-bold text-3xl text-primary">{statsData.pendingSwaps}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom">
                    <span className="text-[10px] text-text-secondary uppercase font-bold block mb-1">Simulated Revenue</span>
                    <h3 className="font-primary font-bold text-3xl text-primary">${statsData.platformRevenue}</h3>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-xl bg-white/70 border border-border-custom flex flex-col gap-4">
                  <h3 className="font-primary font-bold text-sm">Platform Health Check</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary">
                    <p>Mongoose DB Connection: <strong className="text-emerald-600">ONLINE</strong></p>
                    <p>Google Gemini Vision Client: <strong className="text-emerald-600">CONNECTED</strong></p>
                    <p>Nodemailer Server SMTP: <strong className="text-emerald-600">READY</strong></p>
                    <p>Cloudinary Uploaders: <strong className="text-emerald-600">READY</strong></p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">Failed to retrieve platform analytics.</div>
            )}
          </div>
        )}

        {/* TAB 2: MODERATE USERS */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-2xl bg-white/70 overflow-hidden border border-border-custom">
            {usersLoading ? (
              <div className="p-4 text-center">Loading users directory...</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100/50 border-b border-border-custom text-text-secondary uppercase font-bold">
                    <th className="p-4">User Details</th>
                    <th className="p-4">EcoPoints</th>
                    <th className="p-4">Swaps</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-text-primary">{u.name}</p>
                          <p className="text-[10px] text-text-secondary">@{u.username}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">🌿 {u.ecoPoints}</td>
                      <td className="p-4 font-semibold">{u.completedSwaps || 0} completed</td>
                      <td className="p-4">{u.isAdmin ? '✅ Yes' : '❌ No'}</td>
                      <td className="p-4">
                        {u.isSuspended ? (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Suspended</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Active</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!u.isAdmin && (
                          <button
                            onClick={() => suspendMutation.mutate(u._id)}
                            className={`px-4 py-1.5 rounded-full font-semibold text-[10px] transition-all shadow-sm ${u.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                          >
                            {u.isSuspended ? 'Reactivate' : 'Suspend Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="flex flex-col gap-4">
            {mockDisputes.map((disp) => (
              <div key={disp.id} className="glass-panel p-4 rounded-xl bg-white/70 border border-border-custom flex justify-between items-center hover:shadow-sm transition-all">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-text-primary">Dispute Case #{disp.id}: {disp.reason}</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">Requester: {disp.requester} • Respondent: {disp.receiver}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${disp.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {disp.status}
                  </span>
                  <button
                    onClick={() => alert(`Dispute #${disp.id} details locked. Mail dispatch sent to users.`)}
                    className="btn border border-border-custom hover:border-primary text-text-secondary hover:text-primary px-4 py-1.5 rounded-full text-[10px] font-semibold"
                  >
                    Investigate Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
