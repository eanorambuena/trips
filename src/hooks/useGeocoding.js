import { useState, useCallback, useRef } from 'react';
import { searchAirports } from '../lib/airports';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function searchNominatim(query) {
  if (!query || query.length < 2) return [];
  const response = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&extratags=1`
  );
  const data = await response.json();
  return data.map((item) => ({
    name: item.address?.city || item.address?.town || item.address?.village || item.name || item.display_name.split(',')[0],
    display: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: 'place',
  }));
}

export function useGeocoding() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const [places, airports] = await Promise.all([
          searchNominatim(query),
          Promise.resolve(searchAirports(query)),
        ]);

        const combined = [
          ...airports.map((a) => ({ ...a, type: 'airport' })),
          ...places.map((p) => ({ ...p, type: 'place' })),
        ].slice(0, 8);

        setSuggestions(combined);
      } catch (err) {
        console.error('Geocoding error:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { suggestions, loading, search, clear };
}