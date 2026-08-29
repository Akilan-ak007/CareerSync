import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin } from 'lucide-react';

// Fix Leaflet marker icon asset paths (Vite bundle issue)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
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

export const MapSelector: React.FC<MapSelectorProps> = ({
  initialLat,
  initialLng,
  initialAddress = '',
  onChange,
}) => {
  const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946]); // Default to Bangalore coordinates
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  // Click handler on map to capture coordinates & fetch address details
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
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
        setAddress(data.display_name);
        onChange({
          latitude: lat,
          longitude: lng,
          formattedAddress: data.display_name,
          googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
    }
  };

  // Geocoding Search: Text address -> Coordinates (Progressive fallback algorithm)
  const handleSearch = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return;

    setSearching(true);
    try {
      // 1. Check if user pasted a Google Maps URL with lat,lon or q=
      const urlCoords = rawQuery.match(/@(-?\d+\.\d+),(-?\d+\.\d+)|q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (urlCoords) {
        const lat = parseFloat(urlCoords[1] || urlCoords[3]);
        const lon = parseFloat(urlCoords[2] || urlCoords[4]);
        if (!isNaN(lat) && !isNaN(lon)) {
          setPosition([lat, lon]);
          setAddress(rawQuery);
          onChange({
            latitude: lat,
            longitude: lon,
            formattedAddress: rawQuery,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
          });
          setSearching(false);
          return;
        }
      }

      // 2. Build progressive search query candidate list (full string -> stripped comma parts)
      const parts = rawQuery.split(',').map(p => p.trim()).filter(Boolean);
      const queriesToTry: string[] = [rawQuery];

      // Add combinations by dropping left-most terms (e.g. company name)
      for (let i = 1; i < parts.length; i++) {
        const sub = parts.slice(i).join(', ');
        if (sub.length > 3) queriesToTry.push(sub);
      }

      let foundLat: number | null = null;
      let foundLon: number | null = null;

      for (const q of queriesToTry) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
          );
          const data = await res.json();
          if (data && data.length > 0) {
            foundLat = parseFloat(data[0].lat);
            foundLon = parseFloat(data[0].lon);
            break;
          }
        } catch {
          // Continue to next sub-query candidate
        }
      }

      // 3. Fallback: Photon API if Nominatim query failed
      if (foundLat === null) {
        try {
          const photonQuery = parts.slice(Math.max(0, parts.length - 3)).join(', ');
          const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&limit=1`);
          const pData = await pRes.json();
          if (pData && pData.features && pData.features.length > 0) {
            const coords = pData.features[0].geometry.coordinates;
            foundLon = coords[0];
            foundLat = coords[1];
          }
        } catch {
          // ignore fallback error
        }
      }

      if (foundLat !== null && foundLon !== null) {
        setPosition([foundLat, foundLon]);
        setAddress(rawQuery); // Keep user's full detailed address
        onChange({
          latitude: foundLat,
          longitude: foundLon,
          formattedAddress: rawQuery,
          googleMapsUrl: `https://www.google.com/maps?q=${foundLat},${foundLon}`,
        });
      } else {
        // Fallback: Default to Bangalore center if unknown, allow manual marker placement
        setPosition([12.9716, 77.5946]);
        setAddress(rawQuery);
        onChange({
          latitude: 12.9716,
          longitude: 77.5946,
          formattedAddress: rawQuery,
          googleMapsUrl: `https://www.google.com/maps?q=12.9716,77.5946`,
        });
      }
    } catch (error) {
      console.error('Geocoding search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Panel */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search address (e.g. Tidel Park, Chennai)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            className="w-full bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-40 rounded-lg py-2 px-3 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-rosy focus:ring-1 focus:ring-brand-rosy transition-all"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={searching}
          className="bg-brand-cocoa hover:bg-brand-rosy hover:text-brand-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
        >
          <span>{searching ? 'Searching...' : 'Locate'}</span>
        </button>
      </div>

      {/* Interactive Map Component */}
      <div className="relative">
        <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <MapEvents />
        </MapContainer>
      </div>

      {/* Lat/Long status badges */}
      <div className="p-3 bg-brand-dark bg-opacity-40 border border-brand-cocoa border-opacity-35 rounded-lg flex flex-col space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-brand-rosy font-semibold">
          <MapPin className="w-4 h-4" />
          <span>Selected Location Details</span>
        </div>
        <div className="text-gray-400 leading-relaxed font-medium">
          <span className="text-white">Address:</span> {address || 'No location selected yet. Click map to set marker.'}
        </div>
        <div className="flex space-x-4 text-gray-500 font-mono">
          <div>Latitude: <span className="text-gray-300">{position[0].toFixed(6)}</span></div>
          <div>Longitude: <span className="text-gray-300">{position[1].toFixed(6)}</span></div>
        </div>
      </div>
    </div>
  );
};
