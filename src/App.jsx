import { useState, useRef } from 'react';
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
import { PhotoGallery } from './components/PhotoGallery';
import { TRANSPORT_MODES, getTransportMode } from './lib/transport';
import { saveTrip, getTrips, deleteTrip, generateTripId, generateSegmentId } from './lib/storage';
import { getSmartRoute } from './lib/routing';
import { findNearestAirport } from './lib/airports';

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

const MAP_STYLES = {
  streets: {
    label: '🗺️ Calles',
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  satellite: {
    label: '🛰️ Satélite',
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://tiles.openfreemap.org/styles/liberty',
  },
};

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
  const [selectedSegmentForPhotos, setSelectedSegmentForPhotos] = useState(null);
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);
  const [suggestedRoute, setSuggestedRoute] = useState(null);
  const [mapStyle, setMapStyle] = useState('streets');
  const mapInstanceRef = useRef(null);

  useState(() => {
    setTrips(getTrips());
  });

  const handleOriginSelect = (place) => {
    const displayName = place.display?.split(',')[0] || place.name;
    setOrigin({ value: displayName, place });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [place.lng, place.lat],
        zoom: 12,
        duration: 1000,
      });
    }
  };

  const handleDestinationSelect = (place) => {
    const displayName = place.display?.split(',')[0] || place.name;
    setDestination({ value: displayName, place });
  };

  const calculateRoute = async () => {
    if (!origin.place || !destination.place) {
      setError('Selecciona origen y destino');
      return;
    }

    setError('');
    setLoading(true);
    setSuggestedRoute(null);

    try {
      const route = await getSmartRoute(origin.place, destination.place);
      
      const newSegments = route.segments.map((seg, i) => ({
        id: generateSegmentId(),
        ...seg,
        photos: [],
      }));

      setSegments(newSegments);
      setSuggestedRoute(route.suggestion);

      setTimeout(() => {
        const points = newSegments.flatMap(s => [s.from, s.to]);
        if (mapInstanceRef.current && points.length > 0) {
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
    setOrigin({ value: trip.origin?.display?.split(',')[0] || trip.origin?.name || '', place: trip.origin });
    setDestination({ value: trip.destination?.display?.split(',')[0] || trip.destination?.name || '', place: trip.destination });
    
    const loadedSegments = (trip.segments || []).map(s => ({
      ...s,
      coordinates: s.mode === 'flight' || s.mode === 'walking' || s.mode === 'bicycle'
        ? [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]]
        : s.coordinates || [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]],
      photos: s.photos || [],
    }));
    setSegments(loadedSegments);

    setTimeout(() => {
      const points = (trip.segments || []).flatMap(s => [s.from, s.to]);
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
    const newSegments = [...segments];
    newSegments[index] = { ...segment, mode };
    setSegments(newSegments);
  };

  const addPhotoToSegment = (segmentId, photo, update = false) => {
    setSegments(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      if (update) {
        return { ...seg, photos: seg.photos.map(p => p.id === photo.id ? photo : p) };
      }
      return { ...seg, photos: [...(seg.photos || []), photo] };
    }));
  };

  const removePhotoFromSegment = (segmentId, photoId) => {
    setSegments(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      return { ...seg, photos: seg.photos.filter(p => p.id !== photoId) };
    }));
  };

  const newTrip = () => {
    setSelectedTrip(null);
    setTripName('');
    setOrigin({ value: '', place: null });
    setDestination({ value: '', place: null });
    setSegments([]);
    setSuggestedRoute(null);
  };

  const renderSegment = (seg, index) => {
    const mode = getTransportMode(seg.mode);
    const photoCount = seg.photos?.length || 0;

    return (
      <div key={seg.id || index} className="border rounded-lg p-3 mb-2 bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg`} style={{ backgroundColor: mode.color }}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{seg.from.name} → {seg.to.name}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{mode.icon} {mode.label}</span>
              <span>{(seg.distance / 1000).toFixed(1)} km</span>
              <span>~{Math.round(seg.duration / 60)} min</span>
              {photoCount > 0 && <span className="text-blue-500">📷 {photoCount}</span>}
            </div>
          </div>
          <select
            value={seg.mode}
            onChange={(e) => updateSegmentMode(index, e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            {TRANSPORT_MODES.map(m => (
              <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
            ))}
          </select>
          <button
            onClick={() => { setSelectedSegmentForPhotos(seg); setShowPhotoPanel(true); }}
            className="text-blue-500 hover:text-blue-700 text-lg"
            title="Fotos"
          >
            📷
          </button>
        </div>
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
          <button onClick={() => setShowSidebar(!showSidebar)} className="text-xl">☰</button>
          <h1 className="text-xl font-bold flex-1">Travel Routes</h1>
          <div className="flex gap-1">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setMapStyle(key)}
                className={`px-3 py-1 rounded text-sm ${mapStyle === key ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                {style.label}
              </button>
            ))}
          </div>
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
              placeholder="Ciudad o dirección"
              icon="A"
              className="w-64"
            />

            <PlaceInput
              label="Destino"
              value={destination.value}
              onChange={(e) => setDestination({ value: e.target.value, place: null })}
              onSelect={handleDestinationSelect}
              placeholder="Ciudad o dirección"
              icon="B"
              className="w-64"
            />

            <button
              onClick={calculateRoute}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🔍'}
              Buscar Ruta
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {suggestedRoute && (
            <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
              <strong>💡 Sugerencia:</strong> {suggestedRoute.summary}
            </div>
          )}

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
                {Math.round(segments.reduce((s, seg) => s + seg.duration, 0) / 60)} min ·{' '}
                {segments.reduce((s, seg) => s + (seg.photos?.length || 0), 0)} fotos
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
              styles={{
                light: MAP_STYLES[mapStyle].light,
                dark: MAP_STYLES[mapStyle].dark,
              }}
            >
              <MapControls showZoom showCompass showLocate />

              {segments.map((seg, i) => (
                <div key={seg.id || i}>
                  <MapMarker longitude={seg.from.lng} latitude={seg.from.lat}>
                    <MarkerContent>
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg bg-green-500">
                        {i === 0 ? 'A' : String.fromCharCode(66 + i)}
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <p className="font-semibold text-sm">{seg.from.name}</p>
                    </MarkerPopup>
                  </MapMarker>

                  {i === segments.length - 1 && (
                    <MapMarker longitude={seg.to.lng} latitude={seg.to.lat}>
                      <MarkerContent>
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg bg-red-500">
                          B
                        </div>
                      </MarkerContent>
                      <MarkerPopup>
                        <p className="font-semibold text-sm">{seg.to.name}</p>
                      </MarkerPopup>
                    </MapMarker>
                  )}

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
              ))}
            </MapComponent>
          </Card>
        </div>

        {showPhotoPanel && selectedSegmentForPhotos && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-end" onClick={() => setShowPhotoPanel(false)}>
            <div className="w-96 h-full bg-white shadow-xl overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between bg-gray-50 sticky top-0">
                <h3 className="font-bold">📷 {selectedSegmentForPhotos.from.name} → {selectedSegmentForPhotos.to.name}</h3>
                <button onClick={() => setShowPhotoPanel(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-4">
                <PhotoGallery
                  photos={selectedSegmentForPhotos.photos || []}
                  onAdd={(photo, update) => addPhotoToSegment(selectedSegmentForPhotos.id, photo, update)}
                  onRemove={(photoId) => removePhotoFromSegment(selectedSegmentForPhotos.id, photoId)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-2 text-xs text-gray-500 flex gap-4 justify-center bg-gray-100 flex-wrap">
          {TRANSPORT_MODES.slice(0, 6).map(m => (
            <span key={m.id}>{m.icon} <strong>{m.label}</strong></span>
          ))}
        </div>
      </div>
    </div>
  );
}