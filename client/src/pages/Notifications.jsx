import React, { useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import Sidebar from '../components/Sidebar.jsx';
import { SocketContext } from '../context/SocketContext.jsx';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { clearLiveNotifications } = useContext(SocketContext);

  // 1. Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/users/me/notifications');
      return response.data.notifications;
    }
  });

  const notifications = data || [];

  // 2. Mark all as read mutation
  const markReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/users/me/notifications/read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  // Trigger mark read on mount
  useEffect(() => {
    markReadMutation.mutate();
    clearLiveNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'message':
        return <span className="material-symbols-rounded text-primary">chat_bubble</span>;
      case 'swap_request':
        return <span className="material-symbols-rounded text-primary">handshake</span>;
      case 'swap_accepted':
        return <span className="material-symbols-rounded text-emerald-600">check_circle</span>;
      case 'swap_rejected':
        return <span className="material-symbols-rounded text-error">cancel</span>;
      default:
        return <span className="material-symbols-rounded text-accent">info</span>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar navigation */}
      <Sidebar />

      <section className="flex-1 w-full flex flex-col gap-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl bg-white/70">
          <h2 className="font-primary font-bold text-2xl">Notifications Center</h2>
          <p className="text-text-secondary text-sm">Stay updated on your chat messages, swap resolutions, and eco point credits</p>
        </div>

        {/* Notifications list */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 animate-skeleton rounded-2xl"></div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`glass-panel p-4 rounded-xl flex gap-4 items-center justify-between transition-all border ${notif.isRead ? 'bg-white/40 border-border-custom' : 'bg-white border-primary/20 shadow-sm border-l-4 border-l-primary'}`}
              >
                <div className="flex gap-3 items-center min-w-0">
                  <div className={`p-2 rounded-full flex items-center justify-center ${notif.isRead ? 'bg-gray-100' : 'bg-primary/10'}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-text-primary truncate">{notif.title}</h4>
                    <p className="text-[11px] text-text-secondary mt-0.5">{notif.content}</p>
                    <span className="text-[9px] text-text-light block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl text-center bg-white/70">
            <span className="material-symbols-rounded text-5xl text-text-light mb-4">notifications_off</span>
            <h3 className="font-primary font-bold text-lg">Inbox Clear</h3>
            <p className="text-text-secondary text-sm mt-1">You do not have any notifications currently.</p>
          </div>
        )}
      </section>
    </div>
  );
}
