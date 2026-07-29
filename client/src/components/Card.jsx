import React from 'react';
import { Link } from 'react-router-dom';

export default function Card({ item }) {
  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'New with Tags':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">New w/ Tags</span>;
      case 'Like New':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Like New</span>;
      case 'Good':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Good</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">{condition}</span>;
    }
  };

  const imageSrc = item.images?.[0] || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="bg-white/70 backdrop-blur-md border border-border-custom rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
      {/* Product Image */}
      <div className="relative h-48 overflow-hidden bg-gray-50">
        <Link to={`/listing/${item._id}`} className="block h-full">
          <img
            src={imageSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        <div className="absolute top-3 left-3 z-10">
          {getConditionBadge(item.condition)}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-primary font-bold px-3 py-1 rounded-full text-xs shadow-sm">
            🌿 {item.swapValue} pts
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-1 text-xs text-text-secondary uppercase tracking-wider font-bold">
          <span>{item.brand}</span>
          <span>Size {item.size}</span>
        </div>

        <h3 className="font-primary font-bold text-sm text-text-primary mb-3 line-clamp-1 group-hover:text-primary transition-all">
          <Link to={`/listing/${item._id}`}>{item.title}</Link>
        </h3>

        {/* Location & availability */}
        <div className="flex items-center gap-1 text-xs text-text-secondary mb-4 mt-auto">
          <span className="material-symbols-rounded text-sm">location_on</span>
          <span className="truncate">{item.locationName}</span>
        </div>

        {/* Action Button */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/listing/${item._id}`}
            className="w-full text-center border border-border-custom hover:border-primary text-text-primary hover:text-primary font-semibold text-xs py-2 rounded-full transition-all"
          >
            Details
          </Link>
          <Link
            to={`/listing/${item._id}`}
            className="w-full text-center bg-primary hover:bg-primary-hover text-white font-semibold text-xs py-2 rounded-full transition-all"
          >
            Swap
          </Link>
        </div>
      </div>
    </div>
  );
}
