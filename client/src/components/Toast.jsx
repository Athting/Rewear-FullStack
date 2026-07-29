import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';

export default function Toast() {
  const { liveNotifications } = useContext(SocketContext);
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    if (liveNotifications.length > 0) {
      const latest = liveNotifications[0];
      setActiveToast(latest);

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [liveNotifications]);

  if (!activeToast) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <span className="material-symbols-rounded text-primary">chat_bubble</span>;
      case 'swap_accepted': return <span className="material-symbols-rounded text-success">check_circle</span>;
      case 'swap_rejected': return <span className="material-symbols-rounded text-error">cancel</span>;
      default: return <span className="material-symbols-rounded text-accent">info</span>;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] max-w-sm w-full bg-white border border-border-custom shadow-2xl rounded-2xl p-4 flex gap-3 items-center animate-slide border-l-4 border-l-primary">
      <div className="p-2 bg-primary/10 rounded-full flex items-center justify-center">
        {getIcon(activeToast.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-primary font-bold text-xs text-text-primary truncate">{activeToast.title}</h4>
        <p className="text-[11px] text-text-secondary truncate mt-0.5">{activeToast.content}</p>
      </div>
      <button onClick={() => setActiveToast(null)} className="text-text-secondary hover:text-text-primary p-1">
        <span className="material-symbols-rounded text-lg">close</span>
      </button>
    </div>
  );
}
