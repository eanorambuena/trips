import { useState } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MapControls,
  MapRoute,
} from './components/ui/map';
import { Card } from './components/ui/card';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function getCoordinates(place) {
  const response = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(place)}&format=json&limit=1`
  );
  const data = await response.json();
  if (data.length > 0) {
    return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
  }
  throw new Error(`No se encontró: ${place}`);
}

async function getRoute(start, end) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`
  );
  const data = await response.json();
  if (data.routes && data.routes.length > 0) {
    return data.routes[0];
  }
  throw new Error('No se encontró ruta');
}

export default function App() {
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);

  const calculateRoute = async () => {
    if (!startPoint || !endPoint) {
      setError('Ingresa origen y destino');
      return;
    }

    setError('');
    setRouteInfo(null);
    setLoading(true);

    try {
      const start = await getCoordinates(startPoint);
      const end = await getCoordinates(endPoint);
      const route = await getRoute(start, end);

      setRouteInfo({
        distance: (route.distance / 1000).toFixed(1),
        duration: Math.round(route.duration / 60),
      });

      setMarkers([
        { id: 'start', lng: start[0], lat: start[1], label: 'Origen' },
        { id: 'end', lng: end[0], lat: end[1], label: 'Destino' },
      ]);

      const coords = route.geometry.coordinates;
      setRouteCoords(coords);
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

      <div className="p-4 bg-white shadow-md">
        <div className="flex gap-4 flex-wrap items-end">
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
          <button
            onClick={calculateRoute}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar Ruta'}
          </button>
        </div>

        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

        {routeInfo && (
          <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded">
            <div>
              <span className="font-semibold text-gray-600">Distancia:</span>{' '}
              {routeInfo.distance} km
            </div>
            <div>
              <span className="font-semibold text-gray-600">Duración:</span>{' '}
              {routeInfo.duration} min
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <Card className="h-[500px] p-0 overflow-hidden">
          <Map center={[-74.006, 40.7128]} zoom={4}>
            <MapControls />

            {markers.map((marker) => (
              <MapMarker
                key={marker.id}
                longitude={marker.lng}
                latitude={marker.lat}
              >
                <MarkerContent>
                  <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold ${
                    marker.id === 'start' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {marker.id === 'start' ? 'A' : 'B'}
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

            {routeCoords.length > 0 && (
              <MapRoute
                coordinates={routeCoords}
                color="#3b9eff"
                width={4}
                opacity={0.8}
              />
            )}
          </Map>
        </Card>
      </div>
    </div>
  );
}