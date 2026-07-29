import React from 'react';

export default function Dialog({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade">
      <div className="bg-white border border-border-custom rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto relative animate-slide">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-primary font-bold text-lg text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-error transition-all p-1"
          >
            <span className="material-symbols-rounded text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="dialog-body-box">
          {children}
        </div>
      </div>
    </div>
  );
}
