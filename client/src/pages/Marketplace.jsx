import React, { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import Card from '../components/Card.jsx';
import LeafletMap from '../components/LeafletMap.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Marketplace() {
  const { user } = useContext(AuthContext);
  const [showMap, setShowMap] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [size, setSize] = useState('');
  const [valueMax, setValueMax] = useState(150);
  const [distance, setDistance] = useState(50); // miles
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Setup geolocation filter query parameters
  const userCoords = user?.locationCoordinates?.coordinates; // [lng, lat]
  const userLat = userCoords?.[1];
  const userLng = userCoords?.[0];

  const categories = ['Denim', 'Outerwear', 'Footwear', 'Knitwear', 'Dresses', 'Blazer', 'Shirts', 'Accessories'];
  const brands = ["Levi's", 'Patagonia', 'Doc Martens', 'Everlane', 'Reformation', 'Nike', 'Zara', 'Barbour'];
  const conditions = ['New with Tags', 'Like New', 'Good', 'Fair'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '9', '10', '32'];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings', search, category, brand, condition, size, valueMax, distance, sort, page],
    queryFn: async () => {
      let url = `/listings?page=${page}&limit=8&sort=${sort}&valueMax=${valueMax}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${category}`;
      if (brand) url += `&brand=${brand}`;
      if (condition) url += `&condition=${condition}`;
      if (size) url += `&size=${size}`;
      
      // If user coordinate and distance filter exist
      if (userLat && userLng && distance > 0) {
        url += `&latitude=${userLat}&longitude=${userLng}&maxDistance=${distance}`;
      }

      const response = await api.get(url);
      return response.data;
    }
  });

  const listings = data?.listings || [];
  const pagesCount = data?.pages || 1;

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setCondition('');
    setSize('');
    setValueMax(150);
    setDistance(50);
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-center bg-white/70 border border-border-custom shadow-sm gap-4">
        <div>
          <h1 className="font-primary font-bold text-3xl text-text-primary">Explore Clothes Swap</h1>
          <p className="text-text-secondary text-sm mt-1">Acquire garments sustainably without spending money. Swap Eco Points!</p>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="btn border border-primary text-primary hover:bg-primary/5 px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
        >
          <span className="material-symbols-rounded">{showMap ? 'layers_clear' : 'map'}</span>
          <span>{showMap ? 'Hide Map View' : 'Show Map View'}</span>
        </button>
      </div>

      {/* Map view display */}
      {showMap && userLat && userLng && (
        <div className="mb-8">
          <LeafletMap
            userLocation={[userLat, userLng]}
            items={listings}
            radius={distance}
            height="340px"
          />
          <p className="text-[10px] text-text-secondary text-center mt-2">
            Displaying available swap listings within a <strong>{distance} miles</strong> radius of your location.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-72 glass-panel p-6 rounded-2xl flex flex-col gap-6 sticky top-24">
          <div className="flex justify-between items-center border-b border-border-custom pb-3">
            <h3 className="font-primary font-bold text-base">Filters</h3>
            <button onClick={handleReset} className="text-xs text-primary font-semibold hover:underline">Reset</button>
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-primary font-bold">Search Keywords</label>
            <div className="relative flex items-center">
              <span className="material-symbols-rounded absolute left-3 text-text-secondary text-xl">search</span>
              <input
                type="text"
                placeholder="Search jeans, coats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Category Chips Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-primary font-bold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Brand select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-primary font-bold">Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Size select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-primary font-bold">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary"
            >
              <option value="">All Sizes</option>
              {sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Condition select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary font-primary font-bold">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary"
            >
              <option value="">All Conditions</option>
              {conditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Value range */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs text-text-secondary font-primary font-bold">
              <span>Max EcoPoints</span>
              <span>{valueMax} pts</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={valueMax}
              onChange={(e) => setValueMax(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Distance filter */}
          {userLat && userLng && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs text-text-secondary font-primary font-bold">
                <span>Max Distance</span>
                <span>{distance} miles</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}
        </aside>

        {/* Listings Grid */}
        <section className="flex-1 w-full">
          {/* Top Sort Controls */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs text-text-secondary font-semibold">
              Found <strong>{data?.total || 0}</strong> garments
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-primary font-bold">Sort By</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-1.5 border border-border-custom bg-white/80 rounded-xl text-xs outline-none focus:border-primary"
              >
                <option value="newest">Newest Added</option>
                <option value="valueLow">EcoPoints: Low to High</option>
                <option value="valueHigh">EcoPoints: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Grid display */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 animate-skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <Card key={item._id} item={item} />
                ))}
              </div>

              {/* Pagination controls */}
              {pagesCount > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border border-border-custom rounded-full hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center"
                  >
                    <span className="material-symbols-rounded">chevron_left</span>
                  </button>
                  <span className="text-xs text-text-secondary font-bold">Page {page} of {pagesCount}</span>
                  <button
                    disabled={page === pagesCount}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border border-border-custom rounded-full hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center"
                  >
                    <span className="material-symbols-rounded">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center gap-4 text-center bg-white/70">
              <span className="material-symbols-rounded text-5xl text-text-light">shopping_bag</span>
              <h3 className="font-primary font-bold text-lg text-text-primary">No Garments Found</h3>
              <p className="text-text-secondary text-sm max-w-sm">No items match your selected filters. Try widening your distance or reducing criteria.</p>
              <button onClick={handleReset} className="btn bg-primary text-white hover:bg-primary-hover px-6 py-2.5 rounded-full font-medium text-xs">Reset All Filters</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
