import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Map as MapComponent,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  MapArc,
} from './components/ui/map';
import { Card } from './components/ui/card';
import { PlaceInput } from './components/PlaceInput';
import { TRANSPORT_MODES, getTransportMode } from './lib/transport';
import { saveTrip, getTrips, deleteTrip, generateTripId, generateSegmentId } from './lib/storage';
import { useEffect } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function getRouteOSRM(start, end) {
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
  return null;
}

function haversineDistance(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat * Math.PI/180) * Math.cos(p2.lat * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function getSegmentData(from, to, mode) {
  if (mode === 'flight' || mode === 'walking' || mode === 'bicycle') {
    const distance = haversineDistance(from, to);
    const speed = TRANSPORT_MODES.find(m => m.id === mode)?.speed || 80;
    return {
      coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
      distance: distance * 1000,
      duration: (distance / speed) * 3600,
    };
  }

  const route = await getRouteOSRM(from, to);
  if (route) return route;

  const distance = haversineDistance(from, to);
  const speed = TRANSPORT_MODES.find(m => m.id === mode)?.speed || 60;
  return {
    coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
    distance: distance * 1000,
    duration: (distance / speed) * 3600,
  };
}

function fitMapBounds(map, points) {
  if (!map || points.length === 0) return;
  
  const bounds = new maplibregl.LngLatBounds();
  points.forEach(p => bounds.extend([p.lng, p.lat]));
  
  map.fitBounds(bounds, {
    padding: 80,
    duration: 1000,
    maxZoom: 12,
  });
}

const TripSidebar = ({ trips, onSelect, onDelete, selectedTripId }) => (
  <div className="w-72 bg-white border-r flex flex-col h-full">
    <div className="p-4 border-b">
      <h2 className="font-bold text-lg">Mis Viajes</h2>
    </div>
    <div className="flex-1 overflow-auto p-2 space-y-2">
      {trips.length === 0 ? (
        <p className="text-gray-500 text-sm p-4 text-center">No hay viajes guardados</p>
      ) : (
        trips.map(trip => (
          <div
            key={trip.id}
            onClick={() => onSelect(trip)}
            className={`p-3 rounded-lg cursor-pointer border transition-all ${
              selectedTripId === trip.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300 bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm">{trip.name}</div>
            <div className="text-xs text-gray-500">{trip.segments?.length || 0} segmentos</div>
            <div className="text-xs text-gray-400">
              {trip.segments?.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000 || 0} km
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function App() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [origin, setOrigin] = useState({ value: '', place: null });
  const [destination, setDestination] = useState({ value: '', place: null });
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [tripName, setTripName] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    setTrips(getTrips());
  }, []);

  const handleOriginSelect = (place) => {
    setOrigin({ value: place.name, place });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [place.lng, place.lat],
        zoom: 10,
        duration: 1000,
      });
    }
  };

  const handleDestinationSelect = (place) => {
    setDestination({ value: place.name, place });
  };

  const calculateRoute = async () => {
    if (!origin.place || !destination.place) {
      setError('Selecciona origen y destino');
      return;
    }

    setError('');
    setLoading(true);
    setSegments([]);

    try {
      const segmentData = await getSegmentData(origin.place, destination.place, 'driving');

      const newSegment = {
        id: generateSegmentId(),
        mode: 'driving',
        from: { name: origin.place.name, lat: origin.place.lat, lng: origin.place.lng },
        to: { name: destination.place.name, lat: destination.place.lat, lng: destination.place.lng },
        distance: segmentData.distance,
        duration: segmentData.duration,
        coordinates: segmentData.coordinates,
      };

      setSegments([newSegment]);

      setTimeout(() => {
        const points = [origin.place, destination.place];
        if (mapInstanceRef.current) {
          fitMapBounds(mapInstanceRef.current, points);
        }
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentTrip = () => {
    if (segments.length === 0) return;

    const trip = {
      id: selectedTrip?.id || generateTripId(),
      name: tripName || `${origin.value} → ${destination.value}`,
      origin: origin.place,
      destination: destination.place,
      segments: segments.map(s => ({
        ...s,
        coordinates: undefined,
        photos: s.photos || [],
      })),
      totalDistance: segments.reduce((sum, s) => sum + s.distance, 0),
      totalDuration: segments.reduce((sum, s) => sum + s.duration, 0),
    };

    saveTrip(trip);
    setTrips(getTrips());
    setSelectedTrip(trip);
    setTripName(trip.name);
  };

  const loadTrip = (trip) => {
    setSelectedTrip(trip);
    setTripName(trip.name);
    setOrigin({ value: trip.origin?.name || '', place: trip.origin });
    setDestination({ value: trip.destination?.name || '', place: trip.destination });
    
    const loadedSegments = trip.segments.map(s => ({
      ...s,
      coordinates: s.mode === 'flight' || s.mode === 'walking' || s.mode === 'bicycle'
        ? [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]]
        : s.coordinates || [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]],
    }));
    setSegments(loadedSegments);

    setTimeout(() => {
      const points = trip.segments.flatMap(s => [s.from, s.to]);
      if (mapInstanceRef.current && points.length > 0) {
        fitMapBounds(mapInstanceRef.current, points);
      }
    }, 100);
  };

  const removeTrip = (id) => {
    deleteTrip(id);
    setTrips(getTrips());
    if (selectedTrip?.id === id) {
      setSelectedTrip(null);
      setSegments([]);
      setOrigin({ value: '', place: null });
      setDestination({ value: '', place: null });
      setTripName('');
    }
  };

  const updateSegmentMode = async (index, mode) => {
    const segment = segments[index];
    const newSegment = { ...segment, mode };
    
    try {
      const data = await getSegmentData(segment.from, segment.to, mode);
      newSegment.coordinates = data.coordinates;
      newSegment.distance = data.distance;
      newSegment.duration = data.duration;
    } catch {}

    const newSegments = [...segments];
    newSegments[index] = newSegment;
    setSegments(newSegments);
  };

  const newTrip = () => {
    setSelectedTrip(null);
    setTripName('');
    setOrigin({ value: '', place: null });
    setDestination({ value: '', place: null });
    setSegments([]);
  };

  const renderSegment = (seg, index) => {
    const mode = getTransportMode(seg.mode);

    return (
      <div key={seg.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`} style={{ backgroundColor: mode.color }}>
          {mode.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{seg.from.name} → {seg.to.name}</div>
          <div className="text-xs text-gray-500">
            {(seg.distance / 1000).toFixed(1)} km · {Math.round(seg.duration / 60)} min
          </div>
        </div>
        <select
          value={seg.mode}
          onChange={(e) => updateSegmentMode(index, e.target.value)}
          className="text-xs border rounded px-1 py-1"
        >
          {TRANSPORT_MODES.map(m => (
            <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {showSidebar && (
        <TripSidebar
          trips={trips}
          selectedTripId={selectedTrip?.id}
          onSelect={loadTrip}
          onDelete={removeTrip}
        />
      )}

      <div className="flex-1 flex flex-col">
        <header className="bg-slate-900 text-white p-4 flex items-center gap-4">
          <button onClick={() => setShowSidebar(!showSidebar)} className="text-xl">
            ☰
          </button>
          <h1 className="text-xl font-bold flex-1">Travel Routes</h1>
          <button onClick={newTrip} className="bg-blue-500 px-4 py-2 rounded text-sm hover:bg-blue-600">
            + Nuevo
          </button>
        </header>

        <div className="p-4 bg-white shadow-md">
          <div className="flex gap-4 flex-wrap items-end">
            <PlaceInput
              label="Origen"
              value={origin.value}
              onChange={(e) => setOrigin({ value: e.target.value, place: null })}
              onSelect={handleOriginSelect}
              placeholder="Ciudad de origen"
              icon="A"
              className="w-56"
            />

            <PlaceInput
              label="Destino"
              value={destination.value}
              onChange={(e) => setDestination({ value: e.target.value, place: null })}
              onSelect={handleDestinationSelect}
              placeholder="Ciudad de destino"
              icon="B"
              className="w-56"
            />

            <button
              onClick={calculateRoute}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : '🔍'}
              Buscar
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {segments.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <div className="flex gap-4 mb-2">
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="Nombre del viaje"
                  className="border rounded px-3 py-1 text-sm flex-1"
                />
                <button
                  onClick={saveCurrentTrip}
                  className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600"
                >
                  💾 Guardar
                </button>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Total: {(segments.reduce((s, seg) => s + seg.distance, 0) / 1000).toFixed(1)} km ·{' '}
                {Math.round(segments.reduce((s, seg) => s + seg.duration, 0) / 60)} min
              </div>
              {segments.map((seg, i) => renderSegment(seg, i))}
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <Card className="h-full p-0 overflow-hidden shadow-lg">
            <MapComponent
              center={[-74.006, 40.7128]}
              zoom={4}
              ref={(map) => { mapInstanceRef.current = map; }}
            >
              <MapControls />

              {segments.map((seg, i) => {
                const markers = [
                  { id: `${seg.id}-from`, lng: seg.from.lng, lat: seg.from.lat, label: seg.from.name, color: 'green' },
                  { id: `${seg.id}-to`, lng: seg.to.lng, lat: seg.to.lat, label: seg.to.name, color: 'red' },
                ];

                return (
                  <div key={seg.id || i}>
                    {markers.map((m, mi) => (
                      <MapMarker key={m.id} longitude={m.lng} latitude={m.lat}>
                        <MarkerContent>
                          <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg bg-${m.color}-500`}>
                            {i === 0 && mi === 0 ? 'A' : String.fromCharCode(66 + i)}
                          </div>
                        </MarkerContent>
                        <MarkerPopup>
                          <p className="font-semibold text-sm">{m.label}</p>
                        </MarkerPopup>
                      </MapMarker>
                    ))}

                    {seg.mode === 'flight' ? (
                      <MapArc
                        data={[{ id: seg.id, from: [seg.from.lng, seg.from.lat], to: [seg.to.lng, seg.to.lat] }]}
                        curvature={0.15}
                        paint={{ 'line-color': '#8b5cf6', 'line-width': 3, 'line-opacity': 0.8, 'line-dasharray': [3, 2] }}
                      />
                    ) : seg.mode === 'walking' || seg.mode === 'bicycle' ? (
                      <MapArc
                        data={[{ id: seg.id, from: [seg.from.lng, seg.from.lat], to: [seg.to.lng, seg.to.lat] }]}
                        curvature={0}
                        paint={{ 'line-color': '#6b7280', 'line-width': 2, 'line-opacity': 0.6, 'line-dasharray': [4, 2] }}
                      />
                    ) : (
                      <MapRoute
                        coordinates={seg.coordinates}
                        color={getTransportMode(seg.mode).color}
                        width={4}
                        opacity={0.8}
                      />
                    )}
                  </div>
                );
              })}
            </MapComponent>
          </Card>
        </div>

        <div className="p-2 text-xs text-gray-500 flex gap-4 justify-center bg-gray-100">
          {TRANSPORT_MODES.slice(0, 6).map(m => (
            <span key={m.id}>{m.icon} <strong>{m.label}</strong></span>
          ))}
        </div>
      </div>
    </div>
  );
}