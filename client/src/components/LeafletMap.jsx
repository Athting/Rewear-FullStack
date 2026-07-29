import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker asset resolution in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LeafletMap({
  userLocation, // [lat, lng]
  items = [], // array of listings
  radius = 0, // distance filter in miles
  onMapClick, // callback returning { lat, lng }
  height = '400px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circleBufferRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map instance
    const defaultCenter = userLocation || [37.7749, -122.4194]; // San Francisco fallback
    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);
    mapInstanceRef.current = map;

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Create markers layer group
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Map Click Listener (for coordinate setting)
    if (onMapClick) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onMapClick({ lat, lng });

        // Draw temporary marker representing clicked point
        markersLayerRef.current.clearLayers();
        L.marker([lat, lng])
          .addTo(markersLayerRef.current)
          .bindPopup('Swap Location Selected')
          .openPopup();
      });
    }

    return () => {
      map.remove();
    };
  }, []);

  // Update center, items markers and circles dynamically on updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    if (markersLayerRef.current && !onMapClick) {
      markersLayerRef.current.clearLayers();
    }

    // Clear previous circle buffer
    if (circleBufferRef.current) {
      map.removeLayer(circleBufferRef.current);
    }

    // 1. Draw User location (Green Custom Marker)
    if (userLocation) {
      const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker(userLocation, { icon: greenIcon })
        .addTo(markersLayerRef.current)
        .bindPopup('<b>Your Swap Center</b>')
        .openPopup();

      // Pan to user location
      map.panTo(userLocation);

      // 2. Draw Distance Circle Buffer (convert miles to meters: 1 mile = 1609.34m)
      if (radius > 0) {
        const radiusMeters = radius * 1609.34;
        circleBufferRef.current = L.circle(userLocation, {
          radius: radiusMeters,
          color: '#2E7D32',
          fillColor: '#66BB6A',
          fillOpacity: 0.15,
          weight: 2
        }).addTo(map);

        // Auto zoom fit circle boundary
        map.fitBounds(circleBufferRef.current.getBounds());
      }
    }

    // 3. Draw Clothing Items Locations (Standard Blue Markers)
    if (items.length > 0 && !onMapClick) {
      items.forEach((item) => {
        const coords = item.locationCoordinates?.coordinates;
        if (coords && coords.length === 2) {
          // GeoJSON coordinates order is [longitude, latitude], convert to leaflet latlng [lat, lng]
          const latLng = [coords[1], coords[0]];
          
          L.marker(latLng)
            .addTo(markersLayerRef.current)
            .bindPopup(`
              <div style="min-width: 140px; font-family: sans-serif;">
                <img src="${item.images?.[0]}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />
                <h5 style="margin: 0; font-weight: bold; font-size: 0.85rem;">${item.title}</h5>
                <p style="margin: 2px 0; font-size: 0.75rem; color: #2E7D32; font-weight: bold;">Value: 🌿 ${item.swapValue} pts</p>
                <a href="/listing/${item._id}" style="display: block; text-align: center; background: #2E7D32; color: white; padding: 4px; border-radius: 4px; font-size: 0.75rem; text-decoration: none; margin-top: 4px;">View Item</a>
              </div>
            `);
        }
      });
    }
  }, [userLocation, items, radius]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="map-container"
    />
  );
}
