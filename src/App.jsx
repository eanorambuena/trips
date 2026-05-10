import { useState } from 'react';
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

async function getCoordinates(place) {
  const response = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(place)}&format=json&limit=1`
  );
  const data = await response.json();
  if (data.length > 0) {
    return {
      lng: parseFloat(data[0].lon),
      lat: parseFloat(data[0].lat),
      name: data[0].display_name.split(',')[0],
    };
  }
  throw new Error(`No se encontró: ${place}`);
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
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
  );
  const data = await response.json();
  if (data.routes && data.routes.length > 0) {
    const distance = data.routes[0].distance;
    const duration = distance / 30 * 3.6;
    return {
      coordinates: data.routes[0].geometry.coordinates,
      distance,
      duration,
    };
  }
  throw new Error('No se encontró ruta');
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

const TRANSPORT_MODES = {
  driving: { label: 'Carretera', color: '#3b9eff', icon: '🚗' },
  flight: { label: 'Avión', color: '#8b5cf6', icon: '✈️' },
  train: { label: 'Tren', color: '#22c55e', icon: '🚄' },
};

export default function App() {
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [viaPoints, setViaPoints] = useState([{ name: '', mode: 'flight' }]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allMarkers, setAllMarkers] = useState([]);
  const [segments, setSegments] = useState([]);

  const addViaPoint = () => {
    setViaPoints([...viaPoints, { name: '', mode: 'flight' }]);
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
    const points = [{ name: startPoint }];
    viaPoints.forEach((vp) => {
      if (vp.name.trim()) {
        points.push({ name: vp.name, mode: vp.mode });
      }
    });
    points.push({ name: endPoint });

    if (points.some((p) => !p.name.trim())) {
      setError('Ingresa todas las ciudades');
      return;
    }

    if (points.length < 2) {
      setError('Ingresa origen y destino');
      return;
    }

    setError('');
    setRouteInfo(null);
    setLoading(true);

    try {
      const locations = [];
      for (const point of points) {
        const coords = await getCoordinates(point.name);
        locations.push({ ...coords, mode: point.mode || 'driving' });
      }

      const allMarkers = locations.map((loc, i) => ({
        id: `point-${i}`,
        lng: loc.lng,
        lat: loc.lat,
        label: loc.name,
        isTerminal: i === 0 || i === locations.length - 1,
      }));
      setAllMarkers(allMarkers);

      const newSegments = [];
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < locations.length - 1; i++) {
        const from = locations[i];
        const to = locations[i + 1];
        const mode = from.mode || 'driving';

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
        <div className="flex gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Origen</label>
            <input
              type="text"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              placeholder="Ciudad de origen"
              className="border rounded px-3 py-2 w-48"
              onKeyDown={(e) => e.key === 'Enter' && calculateRoute()}
            />
          </div>

          {viaPoints.map((via, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">
                  Escala {index + 1}
                </label>
                <input
                  type="text"
                  value={via.name}
                  onChange={(e) => updateViaPoint(index, 'name', e.target.value)}
                  placeholder="Ciudad"
                  className="border rounded px-3 py-2 w-40"
                />
                <select
                  value={via.mode}
                  onChange={(e) => updateViaPoint(index, 'mode', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="flight">✈️ Avión</option>
                  <option value="train">🚄 Tren</option>
                  <option value="driving">🚗 Carretera</option>
                </select>
              </div>
              <button
                onClick={() => removeViaPoint(index)}
                className="text-red-500 hover:text-red-700 pb-2"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Destino</label>
            <input
              type="text"
              value={endPoint}
              onChange={(e) => setEndPoint(e.target.value)}
              placeholder="Ciudad de destino"
              className="border rounded px-3 py-2 w-48"
              onKeyDown={(e) => e.key === 'Enter' && calculateRoute()}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addViaPoint}
            className="text-blue-500 hover:text-blue-700 border border-blue-500 px-3 py-1 rounded text-sm"
          >
            + Agregar escala
          </button>
          <button
            onClick={calculateRoute}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar Ruta'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {routeInfo && (
          <div className="p-4 bg-gray-50 rounded space-y-2">
            <div className="flex gap-6">
              <div>
                <span className="font-semibold text-gray-600">Distancia total:</span>{' '}
                {routeInfo.distance} km
              </div>
              <div>
                <span className="font-semibold text-gray-600">Duración:</span>{' '}
                {routeInfo.duration} min
              </div>
              <div>
                <span className="font-semibold text-gray-600">Tramos:</span>{' '}
                {routeInfo.segments}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {segments.map((seg, i) => (
                <span key={seg.id}>
                  {TRANSPORT_MODES[seg.mode].icon} {TRANSPORT_MODES[seg.mode].label}: {(seg.distance / 1000).toFixed(1)} km, {Math.round(seg.duration / 60)} min
                  {i < segments.length - 1 && ' → '}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <Card className="h-[500px] p-0 overflow-hidden">
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
                    className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold ${
                      i === 0
                        ? 'bg-green-500'
                        : i === allMarkers.length - 1
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="space-y-1">
                    <p className="font-medium">{marker.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}

            {segments.map((seg, i) =>
              seg.mode === 'flight' ? (
                <MapArc
                  key={seg.id}
                  data={[
                    {
                      id: seg.id,
                      from: seg.from,
                      to: seg.to,
                    },
                  ]}
                  curvature={0.2}
                  paint={{
                    'line-color': '#8b5cf6',
                    'line-width': 3,
                    'line-opacity': 0.8,
                    'line-dasharray': [2, 1],
                  }}
                />
              ) : seg.mode === 'train' ? (
                <MapArc
                  key={seg.id}
                  data={[
                    {
                      id: seg.id,
                      from: seg.from,
                      to: seg.to,
                    },
                  ]}
                  curvature={0}
                  paint={{
                    'line-color': '#22c55e',
                    'line-width': 4,
                    'line-opacity': 0.9,
                  }}
                />
              ) : (
                <MapRoute
                  key={seg.id}
                  coordinates={seg.coordinates}
                  color="#3b9eff"
                  width={4}
                  opacity={0.8}
                />
              )
            )}
          </Map>
        </Card>
      </div>

      <div className="p-4 text-sm text-gray-600 flex gap-4 justify-center">
        <span>✈️ <strong>Avión</strong> - Línea morada punteada</span>
        <span>🚄 <strong>Tren</strong> - Línea verde</span>
        <span>🚗 <strong>Carretera</strong> - Línea azul</span>
      </div>
    </div>
  );
}