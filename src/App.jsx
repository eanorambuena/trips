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

async function searchPlaces(query) {
  if (!query || query.length < 2) return [];
  const response = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
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

const TRANSPORT_MODES = [
  { id: 'driving', label: '🚗 Carretera', color: '#3b9eff' },
  { id: 'flight', label: '✈️ Avión', color: '#8b5cf6' },
  { id: 'train', label: '🚄 Tren', color: '#22c55e' },
];

function PlaceInput({ label, value, onChange, onSelect, placeholder, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${icon === 'A' ? 'bg-green-500' : 'bg-red-500'}`}>
          {icon}
        </div>
        <label className="text-sm font-semibold text-gray-600">{label}</label>
      </div>
      <div className="relative">
        <input
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

export default function App() {
  const [startPoint, setStartPoint] = useState('');
  const [startPlace, setStartPlace] = useState(null);
  const [endPoint, setEndPoint] = useState('');
  const [endPlace, setEndPlace] = useState(null);
  const [transportMode, setTransportMode] = useState('driving');
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [segments, setSegments] = useState([]);

  const calculateRoute = async () => {
    let startCoords = startPlace;
    let endCoords = endPlace;

    if (!startCoords && startPoint.trim()) {
      try {
        const results = await searchPlaces(startPoint);
        if (results.length > 0) startCoords = results[0];
      } catch {}
    }

    if (!endCoords && endPoint.trim()) {
      try {
        const results = await searchPlaces(endPoint);
        if (results.length > 0) endCoords = results[0];
      } catch {}
    }

    if (!startCoords || !endCoords) {
      setError('Ingresa origen y destino');
      return;
    }

    setError('');
    setRouteInfo(null);
    setLoading(true);

    try {
      setMarkers([
        { id: 'start', lng: startCoords.lng, lat: startCoords.lat, label: startCoords.name },
        { id: 'end', lng: endCoords.lng, lat: endCoords.lat, label: endCoords.name },
      ]);

      let segment;
      if (transportMode === 'flight') {
        segment = await getFlightRoute(startCoords, endCoords);
      } else if (transportMode === 'train') {
        segment = await getTrainRoute(startCoords, endCoords);
      } else {
        segment = await getDrivingRoute(startCoords, endCoords);
      }

      setSegments([{
        id: 'seg-0',
        from: [startCoords.lng, startCoords.lat],
        to: [endCoords.lng, endCoords.lat],
        coordinates: segment.coordinates,
        mode: transportMode,
        distance: segment.distance,
        duration: segment.duration,
      }]);

      setRouteInfo({
        distance: (segment.distance / 1000).toFixed(1),
        duration: Math.round(segment.duration / 60),
        mode: transportMode,
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
            icon="A"
          />

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
            icon="B"
          />
        </div>

        <div className="flex gap-2">
          {TRANSPORT_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTransportMode(mode.id)}
              className={`px-4 py-2 rounded border transition-all ${
                transportMode === mode.id
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button
          onClick={calculateRoute}
          disabled={loading}
          className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Buscando...
            </>
          ) : (
            <>🔍 Buscar Ruta</>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded">
            ⚠️ {error}
          </div>
        )}

        {routeInfo && (
          <div className={`p-4 rounded-lg space-y-2 ${
            routeInfo.mode === 'flight' ? 'bg-purple-50' :
            routeInfo.mode === 'train' ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            <div className="flex gap-8 text-lg">
              <div>
                <span className="font-semibold text-gray-600">Distancia:</span>{' '}
                <span className="font-bold">{routeInfo.distance} km</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Duración:</span>{' '}
                <span className="font-bold">{routeInfo.duration} min</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {TRANSPORT_MODES.find((m) => m.id === routeInfo.mode)?.label}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <Card className="h-[500px] p-0 overflow-hidden shadow-lg">
          <Map center={[-74.006, 40.7128]} zoom={4}>
            <MapControls />

            {markers.map((marker, i) => (
              <MapMarker
                key={marker.id}
                longitude={marker.lng}
                latitude={marker.lat}
              >
                <MarkerContent>
                  <div
                    className={`w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg ${
                      i === 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {i === 0 ? 'A' : 'B'}
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
        <span>✈️ <strong>Avión</strong> - Línea morada punteada</span>
        <span>🚄 <strong>Tren</strong> - Línea verde</span>
        <span>🚗 <strong>Carretera</strong> - Línea azul</span>
      </div>
    </div>
  );
}