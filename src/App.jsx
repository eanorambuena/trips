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
import { getSmartRouteOptions, finalizeSegments, haversineDistance } from './lib/routing';
import { parseNaturalLanguage } from './lib/ai';

function fitMapBounds(map, points) {
  if (!map || points.length === 0) return;
  const bounds = new maplibregl.LngLatBounds();
  points.forEach(p => bounds.extend([p.lng, p.lat]));
  map.fitBounds(bounds, { padding: 80, duration: 1000, maxZoom: 12 });
}

const MAP_STYLES = {
  streets: { label: '🗺️ Calles', light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  satellite: { label: '🛰️ Satélite', light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/liberty' },
};

const TripSidebar = ({ trips, onSelect, onDelete, selectedTripId, darkMode }) => (
  <div className={`w-72 border-r flex flex-col h-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
    <div className="p-4 border-b">
      <h2 className={`font-bold text-lg ${darkMode ? 'text-white' : ''}`}>Mis Viajes</h2>
    </div>
    <div className="flex-1 overflow-auto p-2 space-y-2">
      {trips.length === 0 ? (
        <p className={`text-sm p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay viajes</p>
      ) : (
        trips.map(trip => (
          <div key={trip.id} onClick={() => onSelect(trip)} className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedTripId === trip.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'} ${darkMode ? 'text-white' : ''}`}>
            <div className="font-medium text-sm">{trip.name}</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{trip.segments?.length || 0} segmentos · {(trip.totalDistance / 1000).toFixed(0)} km</div>
          </div>
        ))
      )}
    </div>
  </div>
);

const RouteOption = ({ option, selected, onSelect, darkMode }) => (
  <div onClick={onSelect} className={`p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'} ${darkMode ? 'text-white' : ''}`}>
    <div className="flex items-center gap-2 mb-2">
      {selected && <span className="text-blue-500">✓</span>}
      <span className="font-medium text-sm">{option.title}</span>
      {option.isRecommended && <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>⭐ Rápida</span>}
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400">
      {(option.totalDistance / 1000).toFixed(0)} km · ~{Math.round(option.totalDuration / 60)} min
    </div>
  </div>
);

export default function App() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [origin, setOrigin] = useState({ value: '', place: null });
  const [destination, setDestination] = useState({ value: '', place: null });
  const [waypoints, setWaypoints] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [tripName, setTripName] = useState('');
  const [selectedSegmentForPhotos, setSelectedSegmentForPhotos] = useState(null);
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [darkMode, setDarkMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const mapInstanceRef = useRef(null);

  useState(() => setTrips(getTrips()));

  const handleOriginSelect = (place) => {
    setOrigin({ value: place.display?.split(',')[0] || place.name, place });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [place.lng, place.lat], zoom: 10, duration: 1000 });
    }
  };

  const handleDestinationSelect = (place) => {
    setDestination({ value: place.display?.split(',')[0] || place.name, place });
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const result = await parseNaturalLanguage(aiInput);
      
      if (result.origin) {
        const originPlace = {
          ...result.origin,
          display: result.origin.display || result.origin.name,
          lng: result.origin.lng,
          lat: result.origin.lat,
        };
        setOrigin({ value: originPlace.display?.split(',')[0] || originPlace.name, place: originPlace });
      }
      
      if (result.destination) {
        const destPlace = {
          ...result.destination,
          display: result.destination.display || result.destination.name,
          lng: result.destination.lng,
          lat: result.destination.lat,
        };
        setDestination({ value: destPlace.display?.split(',')[0] || destPlace.name, place: destPlace });
      }
      
      setWaypoints(result.waypoints || []);
      setAiInput('');
      setShowAiPanel(false);
      
      if (originPlace && destPlace) {
        calculateRouteOptions();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const calculateRouteOptions = async () => {
    if (!origin.place || !destination.place) return;
    setLoading(true);
    setError('');
    setRouteOptions([]);
    setSegments([]);
    
    try {
      const options = getSmartRouteOptions(origin.place, destination.place);
      setRouteOptions(options);
      if (options.length === 1) {
        selectRouteOption(options[0]);
      } else if (options.length > 1) {
        setSelectedOption(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectRouteOption = (option) => {
    setSelectedOption(option);
    const finalized = finalizeSegments(option.segments.map(s => ({ ...s, id: generateSegmentId(), photos: [] })));
    setSegments(finalized);
    
    setTimeout(() => {
      const points = finalized.flatMap(s => [s.from, s.to]);
      if (mapInstanceRef.current && points.length > 0) {
        fitMapBounds(mapInstanceRef.current, points);
      }
    }, 100);
  };

  const calculateRoute = async () => {
    await calculateRouteOptions();
  };

  const saveCurrentTrip = () => {
    if (segments.length === 0) return;
    const trip = {
      id: selectedTrip?.id || generateTripId(),
      name: tripName || `${origin.value} → ${destination.value}`,
      origin: origin.place,
      destination: destination.place,
      segments: segments.map(s => ({ ...s, coordinates: undefined })),
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
      coordinates: s.coordinates || [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]],
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
      setRouteOptions([]);
    }
  };

  const updateSegmentMode = (index, mode) => {
    const newSegments = [...segments];
    newSegments[index] = { ...segments[index], mode };
    setSegments(newSegments);
  };

  const addPhotoToSegment = (segmentId, photo, update = false) => {
    setSegments(prev => prev.map(seg => {
      if (seg.id !== segmentId) return seg;
      if (update) return { ...seg, photos: seg.photos.map(p => p.id === photo.id ? photo : p) };
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
    setWaypoints([]);
    setSegments([]);
    setRouteOptions([]);
    setSelectedOption(null);
  };

  const shareTrip = () => {
    const data = JSON.stringify({ name: tripName, origin: origin.value, destination: destination.value, segments }, null, 2);
    navigator.clipboard.writeText(data);
    alert('Ruta copiada al portapapeles');
  };

  const renderSegment = (seg, index) => {
    const mode = getTransportMode(seg.mode);
    const photoCount = seg.photos?.length || 0;

    return (
      <div key={seg.id || index} className={`border rounded-lg p-3 mb-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: mode.color }}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : ''}`}>{seg.from.name} → {seg.to.name}</div>
            <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>{mode.icon} {mode.label}</span>
              <span>{(seg.distance / 1000).toFixed(1)} km</span>
              <span>~{Math.round(seg.duration / 60)} min</span>
              {photoCount > 0 && <span className="text-blue-500">📷 {photoCount}</span>}
            </div>
          </div>
          <select value={seg.mode} onChange={(e) => updateSegmentMode(index, e.target.value)} className={`text-xs border rounded px-2 py-1 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : ''}`}>
            {TRANSPORT_MODES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
          </select>
          <button onClick={() => { setSelectedSegmentForPhotos(seg); setShowPhotoPanel(true); }} className="text-blue-500 hover:text-blue-700 text-lg" title="Fotos">📷</button>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen flex ${darkMode ? 'dark' : ''}`}>
      <div className={`h-screen flex flex-col flex-1 ${darkMode ? 'bg-gray-900' : ''}`}>
        {showSidebar && <TripSidebar trips={trips} selectedTripId={selectedTrip?.id} onSelect={loadTrip} onDelete={removeTrip} darkMode={darkMode} />}

        <header className="bg-slate-900 text-white p-4 flex items-center gap-4">
          <button onClick={() => setShowSidebar(!showSidebar)} className="text-xl">☰</button>
          <h1 className="text-xl font-bold flex-1">Travel Routes</h1>
          <div className="flex gap-1">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button key={key} onClick={() => setMapStyle(key)} className={`px-3 py-1 rounded text-sm ${mapStyle === key ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>{style.label}</button>
            ))}
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="bg-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-600">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setShowAiPanel(!showAiPanel)} className="bg-purple-500 px-3 py-1 rounded text-sm hover:bg-purple-600">
            🤖 IA
          </button>
          <button onClick={newTrip} className="bg-blue-500 px-4 py-2 rounded text-sm hover:bg-blue-600">+ Nuevo</button>
        </header>

        {showAiPanel && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b">
            <div className="flex gap-2">
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()} placeholder="Ej: Santiago to Maastricht via Amsterdam, prefiero tren" className="flex-1 border rounded px-3 py-2 text-sm" />
              <button onClick={handleAiSubmit} disabled={aiLoading} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50">
                {aiLoading ? '⏳' : '🚀'} Planear
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Ejemplos: "Santiago → Maastricht via Amsterdam" | "Buenos Aires to Paris, stopping in Madrid"
            </div>
          </div>
        )}

        <div className={`p-4 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex gap-4 flex-wrap items-end">
            <PlaceInput label="Origen" value={origin.value} onChange={(e) => setOrigin({ value: e.target.value, place: null })} onSelect={handleOriginSelect} placeholder="Ciudad de origen" icon="A" className="w-56" darkMode={darkMode} />
            <PlaceInput label="Destino" value={destination.value} onChange={(e) => setDestination({ value: e.target.value, place: null })} onSelect={handleDestinationSelect} placeholder="Ciudad de destino" icon="B" className="w-56" darkMode={darkMode} />
            <button onClick={calculateRoute} disabled={loading} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🔍'} Buscar
            </button>
            {segments.length > 0 && (
              <button onClick={saveCurrentTrip} className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600">💾</button>
            )}
            {segments.length > 0 && (
              <button onClick={shareTrip} className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600">📤</button>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {routeOptions.length > 1 && (
            <div className="mt-4 space-y-2">
              <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : ''}`}>Opciones de ruta:</h3>
              {routeOptions.map((opt) => (
                <RouteOption key={opt.id} option={opt} selected={selectedOption?.id === opt.id} onSelect={() => selectRouteOption(opt)} darkMode={darkMode} />
              ))}
            </div>
          )}

          {segments.length > 0 && (
            <div className={`mt-4 p-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex gap-4 mb-2">
                <input type="text" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Nombre del viaje" className={`border rounded px-3 py-1 text-sm flex-1 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : ''}`} />
              </div>
              <div className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total: {(segments.reduce((s, seg) => s + seg.distance, 0) / 1000).toFixed(1)} km · {Math.round(segments.reduce((s, seg) => s + seg.duration, 0) / 60)} min
              </div>
              {segments.map((seg, i) => renderSegment(seg, i))}
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <Card className="h-full p-0 overflow-hidden shadow-lg">
            <MapComponent center={[-74.006, 40.7128]} zoom={4} ref={(map) => { mapInstanceRef.current = map; }} styles={{ light: MAP_STYLES[mapStyle].light, dark: MAP_STYLES[mapStyle].dark }}>
              <MapControls showZoom showCompass showLocate />

              {segments.map((seg, i) => (
                <div key={seg.id || i}>
                  <MapMarker longitude={seg.from.lng} latitude={seg.from.lat}>
                    <MarkerContent>
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: '#22c55e' }}>
                        {i === 0 ? 'A' : String.fromCharCode(66 + i)}
                      </div>
                    </MarkerContent>
                    <MarkerPopup><p className="font-semibold text-sm">{seg.from.name}</p></MarkerPopup>
                  </MapMarker>

                  {i === segments.length - 1 && (
                    <MapMarker longitude={seg.to.lng} latitude={seg.to.lat}>
                      <MarkerContent>
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: '#ef4444' }}>
                          B
                        </div>
                      </MarkerContent>
                      <MarkerPopup><p className="font-semibold text-sm">{seg.to.name}</p></MarkerPopup>
                    </MapMarker>
                  )}

                  {seg.mode === 'flight' ? (
                    <MapArc data={[{ id: seg.id, from: [seg.from.lng, seg.from.lat], to: [seg.to.lng, seg.to.lat] }]} curvature={0.15} paint={{ 'line-color': '#8b5cf6', 'line-width': 3, 'line-opacity': 0.8, 'line-dasharray': [3, 2] }} />
                  ) : seg.mode === 'walking' || seg.mode === 'bicycle' ? (
                    <MapArc data={[{ id: seg.id, from: [seg.from.lng, seg.from.lat], to: [seg.to.lng, seg.to.lat] }]} curvature={0} paint={{ 'line-color': '#6b7280', 'line-width': 2, 'line-opacity': 0.6, 'line-dasharray': [4, 2] }} />
                  ) : (
                    <MapRoute coordinates={seg.coordinates} color={getTransportMode(seg.mode).color} width={4} opacity={0.8} />
                  )}
                </div>
              ))}
            </MapComponent>
          </Card>
        </div>

        {showPhotoPanel && selectedSegmentForPhotos && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-end" onClick={() => setShowPhotoPanel(false)}>
            <div className={`w-96 h-full shadow-xl overflow-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className={`p-4 border-b flex items-center justify-between sticky top-0 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
                <h3 className="font-bold">📷 {selectedSegmentForPhotos.from.name} → {selectedSegmentForPhotos.to.name}</h3>
                <button onClick={() => setShowPhotoPanel(false)} className="text-gray-500">✕</button>
              </div>
              <div className="p-4">
                <PhotoGallery photos={selectedSegmentForPhotos.photos || []} onAdd={(photo, update) => addPhotoToSegment(selectedSegmentForPhotos.id, photo, update)} onRemove={(photoId) => removePhotoFromSegment(selectedSegmentForPhotos.id, photoId)} />
              </div>
            </div>
          </div>
        )}

        <div className={`p-2 text-xs flex gap-4 justify-center flex-wrap ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          {TRANSPORT_MODES.slice(0, 7).map(m => <span key={m.id}>{m.icon} <strong>{m.label}</strong></span>)}
        </div>
      </div>
    </div>
  );
}