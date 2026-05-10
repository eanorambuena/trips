export const TRANSPORT_MODES = [
  { id: 'flight', icon: '✈️', label: 'Avión', color: '#8b5cf6', speed: 800 },
  { id: 'train', icon: '🚄', label: 'Tren', color: '#22c55e', speed: 120 },
  { id: 'driving', icon: '🚗', label: 'Carretera', color: '#3b9eff', speed: 80 },
  { id: 'bus', icon: '🚌', label: 'Bus', color: '#f59e0b', speed: 60 },
  { id: 'flixbus', icon: '🚌', label: 'FlixBus', color: '#84cc16', speed: 70 },
  { id: 'ferry', icon: '⛴️', label: 'Ferry', color: '#06b6d4', speed: 30 },
  { id: 'tram', icon: '🚃', label: 'Tranvía', color: '#ec4899', speed: 25 },
  { id: 'walking', icon: '🚶', label: 'Caminando', color: '#6b7280', speed: 5 },
  { id: 'bicycle', icon: '🚴', label: 'Bicicleta', color: '#f97316', speed: 15 },
];

export function getTransportMode(id) {
  return TRANSPORT_MODES.find((m) => m.id === id) || TRANSPORT_MODES[2];
}

export function suggestTransportMode(distanceKm) {
  if (distanceKm < 5) return 'walking';
  if (distanceKm < 50) return 'bicycle';
  if (distanceKm < 100) return 'tram';
  if (distanceKm < 300) return 'train';
  if (distanceKm < 600) return 'bus';
  if (distanceKm < 1000) return 'flixbus';
  return 'flight';
}