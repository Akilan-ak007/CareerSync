import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Loader2, Navigation, X } from 'lucide-react';

// Fix Leaflet marker icon asset paths (Vite bundle issue)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapSelectorProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onChange: (location: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    googleMapsUrl: string;
  }) => void;
}

interface SearchResultItem {
  lat: number;
  lon: number;
  displayName: string;
}

// Controller to smoothly pan/fly map when position updates
const MapRecenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && !isNaN(position[0]) && !isNaN(position[1])) {
      map.flyTo(position, 15, { duration: 0.8 });
    }
  }, [position, map]);
  return null;
};

export const MapSelector: React.FC<MapSelectorProps> = ({
  initialLat,
  initialLng,
  initialAddress = '',
  onChange,
}) => {
  const [position, setPosition] = useState<[number, number]>(() => {
    if (initialLat != null && initialLng != null && !isNaN(Number(initialLat)) && !isNaN(Number(initialLng))) {
      return [Number(initialLat), Number(initialLng)];
    }
    return [12.9716, 77.5946]; // Default to Bangalore coordinates
  });

  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [searching, setSearching] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (initialLat != null && initialLng != null && !isNaN(Number(initialLat)) && !isNaN(Number(initialLng))) {
      setPosition([Number(initialLat), Number(initialLng)]);
    }
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialLat, initialLng, initialAddress]);

  // Click handler on map to capture coordinates & fetch address details
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setShowResultsDropdown(false);
        reverseGeocode(lat, lng);
      },
    });
    return null;
  };

  // Reverse Geocoding: Coordinates -> Address details (OSM Nominatim API)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        const formatted = data.display_name;
        setAddress(formatted);
        setSearchQuery(formatted);
        onChange({
          latitude: lat,
          longitude: lng,
          formattedAddress: formatted,
          googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      } else {
        const fallback = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        setAddress(fallback);
        onChange({
          latitude: lat,
          longitude: lng,
          formattedAddress: fallback,
          googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      const fallback = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      setAddress(fallback);
      onChange({
        latitude: lat,
        longitude: lng,
        formattedAddress: fallback,
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      });
    }
  };

  // Geocoding Search: Text address -> Coordinates
  const handleSearch = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent, directSelectFirst = false) => {
    if (e) e.preventDefault();
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return;

    setSearching(true);
    setSearchError(null);
    setShowResultsDropdown(false);

    try {
      // 1. Check if user pasted a Google Maps URL or raw coordinates
      const urlCoords = rawQuery.match(/@(-?\d+\.\d+),(-?\d+\.\d+)|q=(-?\d+\.\d+),(-?\d+\.\d+)|(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (urlCoords) {
        const lat = parseFloat(urlCoords[1] || urlCoords[3] || urlCoords[5]);
        const lon = parseFloat(urlCoords[2] || urlCoords[4] || urlCoords[6]);
        if (!isNaN(lat) && !isNaN(lon)) {
          selectLocation(lat, lon, rawQuery);
          setSearching(false);
          return;
        }
      }

      // 2. Query Nominatim API
      let results: SearchResultItem[] = [];
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawQuery)}&limit=5&addressdetails=1`
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          results = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name,
          }));
        }
      } catch (err) {
        console.warn('Nominatim search failed, trying fallback...', err);
      }

      // 3. Fallback: Photon API if Nominatim query failed or returned empty
      if (results.length === 0) {
        try {
          const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(rawQuery)}&limit=5`);
          const pData = await pRes.json();
          if (pData && pData.features && pData.features.length > 0) {
            results = pData.features.map((f: any) => {
              const coords = f.geometry.coordinates;
              const props = f.properties || {};
              const nameParts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
              return {
                lat: coords[1],
                lon: coords[0],
                displayName: nameParts.join(', ') || rawQuery,
              };
            });
          }
        } catch (err) {
          console.warn('Photon fallback failed', err);
        }
      }

      if (results.length > 0) {
        setSearchResults(results);
        if (directSelectFirst || results.length === 1) {
          selectLocation(results[0].lat, results[0].lon, results[0].displayName);
        } else {
          setShowResultsDropdown(true);
        }
      } else {
        setSearchError('No matching locations found. Try a landmark or city name.');
      }
    } catch (error) {
      console.error('Geocoding search failed:', error);
      setSearchError('Search failed. Please try again or click directly on the map.');
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (lat: number, lon: number, formattedAddress: string) => {
    setPosition([lat, lon]);
    setAddress(formattedAddress);
    setSearchQuery(formattedAddress);
    setShowResultsDropdown(false);
    setSearchError(null);
    onChange({
      latitude: lat,
      longitude: lon,
      formattedAddress,
      googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
    });
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingCurrent(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
        setLocatingCurrent(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setSearchError('Unable to retrieve your current location. Check browser permissions.');
        setLocatingCurrent(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Marker drag handler
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const { lat, lng } = marker.getLatLng();
      setPosition([lat, lng]);
      reverseGeocode(lat, lng);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search company address or landmark (e.g. Tidel Park, Chennai)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e, true);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 shadow-xs transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResultsDropdown(false);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => handleSearch(e, true)}
            disabled={searching || !searchQuery.trim()}
            className="bg-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{searching ? 'Locating...' : 'Search'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locatingCurrent}
            title="Use current GPS location"
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 p-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 shrink-0"
          >
            {locatingCurrent ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-700" />
            ) : (
              <Navigation className="w-4 h-4 text-purple-700" />
            )}
          </button>
        </div>

        {/* Results Dropdown */}
        {showResultsDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50">
              Select Matching Location:
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectLocation(item.lat, item.lon, item.displayName)}
                className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-purple-50 hover:text-purple-950 flex items-start space-x-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-700 mt-0.5 shrink-0" />
                <span className="line-clamp-2 leading-relaxed font-medium">{item.displayName}</span>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <p className="text-[11px] text-rose-600 font-semibold mt-1 px-1">{searchError}</p>
        )}
      </div>

      {/* Interactive Map */}
      <div className="h-56 w-full rounded-xl border border-slate-300 overflow-hidden relative shadow-inner">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            ref={markerRef}
          />
          <MapEvents />
          <MapRecenter position={position} />
        </MapContainer>
      </div>
    </div>
  );
};
