import { useState, useEffect, useRef } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapRoute,
  MapArc,
} from './components/ui/map';
import { Card } from './components/ui/card';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_AUTOCOMPLETE = 'https://nominatim.openstreetmap.org/search';

async function searchPlaces(query) {
  if (!query || query.length < 2) return [];
  const response = await fetch(
    `${NOMINATIM_AUTOCOMPLETE}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
  );
  const data = await response.json();
  return data.map((item) => ({
    display: item.display_name,
    name: item.address?.city || item.address?.town || item.address?.village || item.name || item.display_name.split(',')[0],
    lng: parseFloat(item.lon),
    lat: parseFloat(item.lat),
  }));
}

async function getDrivingRoute(start, end) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
  );
  const data = await response.json();
  if (data.routes && data.routes.length > 0) {
    return {
      coordinates: data.routes[0].geometry.coordinates,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };
  }
  throw new Error('No se encontró ruta');
}

async function getTrainRoute(start, end) {
  const route = await getDrivingRoute(start, end);
  return {
    ...route,
    duration: route.distance / 30 * 3.6,
  };
}

function haversineDistance(point1, point2) {
  const R = 6371;
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

async function getFlightRoute(start, end) {
  return {
    coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
    distance: haversineDistance(start, end) * 1000,
    duration: Math.ceil(haversineDistance(start, end) / 800 * 3600),
    isFlight: true,
  };
}

function PlaceInput({ label, value, onChange, onSelect, placeholder, index }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const query = e.target.value;
    onChange(e);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
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
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const getIcon = () => {
    if (index === 0) return 'A';
    if (index === -1) return 'B';
    return null;
  };

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {getIcon() && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            getIcon() === 'A' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {getIcon()}
          </div>
        )}
        <label className="text-sm font-semibold text-gray-600">{label}</label>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="border rounded px-3 py-2 w-full pr-8"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((place, i) => (
              <li
                key={i}
                onClick={() => handleSelect(place)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium text-sm">{place.name}</div>
                <div className="text-xs text-gray-500 truncate">{place.display}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ViaPointInput({ index, point, onChange, onRemove }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const handleNameChange = (e) => {
    const query = e.target.value;
    onChange(index, 'name', e.target.value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (place) => {
    onChange(index, 'name', place.name);
    onChange(index, 'place', place);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const getModeIcon = () => {
    const icons = { flight: '✈️', train: '🚄', driving: '🚗' };
    return icons[point.mode] || '🚗';
  };

  return (
    <div className="flex items-end gap-2">
      <div className="relative flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
            {String.fromCharCode(66 + index)}
          </span>
          Escala {index + 1}
        </label>
        <div className="relative">
          <input
            type="text"
            value={point.name}
            onChange={handleNameChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={handleBlur}
            placeholder="Ciudad"
            className="border rounded px-3 py-2 w-40 pr-8"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
              {suggestions.map((place, i) => (
                <li
                  key={i}
                  onClick={() => handleSelect(place)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium text-sm">{place.name}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <select
        value={point.mode}
        onChange={(e) => onChange(index, 'mode', e.target.value)}
        className="border rounded px-2 py-2 text-sm"
        title="Medio de transporte"
      >
        <option value="flight">✈️ Avión</option>
        <option value="train">🚄 Tren</option>
        <option value="driving">🚗 Carretera</option>
      </select>
      <button
        onClick={() => onRemove(index)}
        className="text-red-500 hover:text-red-700 pb-2 px-2"
        title="Eliminar escala"
      >
        ✕
      </button>
    </div>
  );
}

const TRANSPORT_MODES = {
  driving: { label: 'Carretera', color: '#3b9eff', icon: '🚗' },
  flight: { label: 'Avión', color: '#8b5cf6', icon: '✈️' },
  train: { label: 'Tren', color: '#22c55e', icon: '🚄' },
};

export default function App() {
  const [startPoint, setStartPoint] = useState('');
  const [startPlace, setStartPlace] = useState(null);
  const [endPoint, setEndPoint] = useState('');
  const [endPlace, setEndPlace] = useState(null);
  const [viaPoints, setViaPoints] = useState([{ name: '', mode: 'flight', place: null }]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allMarkers, setAllMarkers] = useState([]);
  const [segments, setSegments] = useState([]);

  const addViaPoint = () => {
    setViaPoints([...viaPoints, { name: '', mode: 'flight', place: null }]);
  };

  const removeViaPoint = (index) => {
    setViaPoints(viaPoints.filter((_, i) => i !== index));
  };

  const updateViaPoint = (index, field, value) => {
    const updated = [...viaPoints];
    updated[index] = { ...updated[index], [field]: value };
    setViaPoints(updated);
  };

  const calculateRoute = async () => {
    const locations = [];

    if (startPlace) {
      locations.push({ ...startPlace, mode: 'flight' });
    } else if (startPoint.trim()) {
      try {
        const results = await searchPlaces(startPoint);
        if (results.length > 0) {
          locations.push({ ...results[0], mode: 'flight' });
        }
      } catch {}
    }

    viaPoints.forEach((vp) => {
      if (vp.place) {
        locations.push({ ...vp.place, mode: vp.mode });
      } else if (vp.name.trim()) {
        locations.push({ name: vp.name, mode: vp.mode, lng: null, lat: null });
      }
    });

    if (endPlace) {
      locations.push({ ...endPlace, mode: 'driving' });
    } else if (endPoint.trim()) {
      try {
        const results = await searchPlaces(endPoint);
        if (results.length > 0) {
          locations.push({ ...results[0], mode: 'driving' });
        }
      } catch {}
    }

    const missingCoords = locations.filter((l) => l.lng === null);
    if (missingCoords.length > 0) {
      setError(`No se encontró: ${missingCoords.map((l) => l.name).join(', ')}`);
      return;
    }

    if (locations.length < 2) {
      setError('Ingresa origen y destino');
      return;
    }

    setError('');
    setRouteInfo(null);
    setLoading(true);

    try {
      const allMarkersData = locations.map((loc, i) => ({
        id: `point-${i}`,
        lng: loc.lng,
        lat: loc.lat,
        label: loc.name,
        isTerminal: i === 0 || i === locations.length - 1,
      }));
      setAllMarkers(allMarkersData);

      const newSegments = [];
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < locations.length - 1; i++) {
        const from = locations[i];
        const to = locations[i + 1];
        const mode = from.mode;

        let segment;
        if (mode === 'flight') {
          segment = await getFlightRoute(from, to);
        } else if (mode === 'train') {
          segment = await getTrainRoute(from, to);
        } else {
          segment = await getDrivingRoute(from, to);
        }

        totalDistance += segment.distance;
        totalDuration += segment.duration;

        newSegments.push({
          id: `seg-${i}`,
          from: [from.lng, from.lat],
          to: [to.lng, to.lat],
          coordinates: segment.coordinates,
          mode,
          distance: segment.distance,
          duration: segment.duration,
        });
      }

      setSegments(newSegments);
      setRouteInfo({
        distance: (totalDistance / 1000).toFixed(1),
        duration: Math.round(totalDuration / 60),
        segments: newSegments.length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white p-4">
        <h1 className="text-xl font-bold">Travel Routes</h1>
      </header>

      <div className="p-4 bg-white shadow-md space-y-4">
        <div className="flex gap-4 flex-wrap items-end">
          <PlaceInput
            label="Origen"
            value={startPoint}
            onChange={(e) => {
              setStartPoint(e.target.value);
              setStartPlace(null);
            }}
            onSelect={(place) => {
              setStartPlace(place);
              setStartPoint(place.name);
            }}
            placeholder="Ciudad de origen"
            index={0}
          />

          {viaPoints.map((via, index) => (
            <ViaPointInput
              key={index}
              index={index}
              point={via}
              onChange={updateViaPoint}
              onRemove={removeViaPoint}
            />
          ))}

          <PlaceInput
            label="Destino"
            value={endPoint}
            onChange={(e) => {
              setEndPoint(e.target.value);
              setEndPlace(null);
            }}
            onSelect={(place) => {
              setEndPlace(place);
              setEndPoint(place.name);
            }}
            placeholder="Ciudad de destino"
            index={-1}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={addViaPoint}
            className="text-blue-500 hover:text-blue-700 border border-blue-500 px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <span>+</span> Agregar escala
          </button>
          <button
            onClick={calculateRoute}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Buscando...
              </>
            ) : (
              <>🔍 Buscar Ruta</>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded">
            ⚠️ {error}
          </div>
        )}

        {routeInfo && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg space-y-3">
            <div className="flex gap-8 text-lg">
              <div>
                <span className="font-semibold text-gray-600">Distancia:</span>{' '}
                <span className="text-blue-600 font-bold">{routeInfo.distance} km</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Duración:</span>{' '}
                <span className="text-purple-600 font-bold">{routeInfo.duration} min</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {segments.map((seg, i) => (
                <div key={seg.id} className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-white ${
                    seg.mode === 'flight' ? 'bg-purple-500' :
                    seg.mode === 'train' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {TRANSPORT_MODES[seg.mode].icon} {(seg.distance / 1000).toFixed(0)}km
                  </span>
                  {i < segments.length - 1 && <span className="text-gray-400">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <Card className="h-[500px] p-0 overflow-hidden shadow-lg">
          <Map center={[-74.006, 40.7128]} zoom={4}>
            <MapControls />

            {allMarkers.map((marker, i) => (
              <MapMarker
                key={marker.id}
                longitude={marker.lng}
                latitude={marker.lat}
              >
                <MarkerContent>
                  <div
                    className={`w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg ${
                      i === 0 ? 'bg-green-500' : i === allMarkers.length - 1 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="space-y-1">
                    <p className="font-semibold text-base">{marker.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}

            {segments.map((seg) =>
              seg.mode === 'flight' ? (
                <MapArc
                  key={seg.id}
                  data={[{ id: seg.id, from: seg.from, to: seg.to }]}
                  curvature={0.15}
                  paint={{
                    'line-color': '#8b5cf6',
                    'line-width': 3,
                    'line-opacity': 0.8,
                    'line-dasharray': [3, 2],
                  }}
                />
              ) : seg.mode === 'train' ? (
                <MapArc
                  key={seg.id}
                  data={[{ id: seg.id, from: seg.from, to: seg.to }]}
                  curvature={0}
                  paint={{
                    'line-color': '#22c55e',
                    'line-width': 5,
                    'line-opacity': 0.9,
                  }}
                />
              ) : (
                <MapRoute
                  key={seg.id}
                  coordinates={seg.coordinates}
                  color="#3b9eff"
                  width={5}
                  opacity={0.85}
                />
              )
            )}
          </Map>
        </Card>
      </div>

      <div className="p-4 text-sm text-gray-600 flex gap-6 justify-center bg-gray-100">
        <span>✈️ <strong>Avión</strong></span>
        <span>🚄 <strong>Tren</strong></span>
        <span>🚗 <strong>Carretera</strong></span>
      </div>
    </div>
  );
}