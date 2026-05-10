import { useState, useRef, useEffect } from 'react';

export function PlaceInput({ label, value, onChange, onSelect, placeholder, icon, className = '' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const listRef = useRef(null);

  const searchAirports = async (query) => {
    const { searchAirports: searchAirportsDb } = await import('../lib/airports');
    const q = query.toLowerCase();
    const AIRPORTS = {
      charleroi: { code: 'CRL', name: 'Charleroi Airport', city: 'Charleroi', country: 'Belgium', lat: 50.46, lng: 4.45 },
      chipol: { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.31, lng: 4.76 },
      santiago: { code: 'SCL', name: 'Aeropuerto de Santiago', city: 'Santiago', country: 'Chile', lat: -33.39, lng: -70.79 },
      treviso: { code: 'TSF', name: 'Treviso Airport', city: 'Treviso', country: 'Italy', lat: 45.65, lng: 12.19 },
      vienna: { code: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', lat: 48.11, lng: 16.57 },
      budapest: { code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', lat: 47.43, lng: 19.26 },
    };
    return Object.values(AIRPORTS)
      .filter((a) => a.city.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .map((a) => ({ ...a, type: 'airport', name: `${a.city} (${a.code})`, display: `${a.city} - ${a.name}` }));
  };

  const searchNominatim = async (query) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
    );
    const data = await response.json();
    return data.map((item) => ({
      name: item.address?.city || item.address?.town || item.address?.village || item.name || item.display_name.split(',')[0],
      display: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: 'place',
    }));
  };

  const handleChange = (e) => {
    const query = e.target.value;
    onChange(e);
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [airports, places] = await Promise.all([searchAirports(query), searchNominatim(query)]);
        setSuggestions([...airports, ...places].slice(0, 8));
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (place) => {
    onSelect(place);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${icon === 'A' ? 'bg-green-500' : 'bg-red-500'}`}>
          {icon}
        </div>
        <label className="text-sm font-semibold text-gray-600">{label}</label>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="border rounded px-3 py-2 w-full pr-8 text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul ref={listRef} className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((place, i) => (
              <li
                key={i}
                onClick={() => handleSelect(place)}
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {place.type === 'airport' && <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">✈️</span>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{place.name}</div>
                    <div className="text-xs text-gray-500 truncate">{place.display}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}