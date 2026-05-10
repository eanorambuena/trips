import { TRANSPORT_MODES } from './transport';
import { findNearestAirport, AIRPORTS } from './airports';

const LONG_FLIGHT_THRESHOLD = 500;
const MEDIUM_FLIGHT_THRESHOLD = 200;

export function haversineDistance(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat * Math.PI/180) * Math.cos(p2.lat * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function estimateFlightTime(distanceKm) {
  return (distanceKm / 800) * 3600 + 1800;
}

function estimateTrainTime(distanceKm) {
  return (distanceKm / 120) * 3600 + 600;
}

function estimateBusTime(distanceKm) {
  return (distanceKm / 60) * 3600 + 600;
}

export function getSmartRoute(origin, destination) {
  return getSmartRouteOptions(origin, destination);
}

export function getSmartRouteOptions(origin, destination) {
  const options = [];
  const dist = haversineDistance(origin, destination);
  
  const originAirport = findNearestAirport(origin.lat, origin.lng, 200);
  const destAirport = findNearestAirport(destination.lat, destination.lng, 200);
  
  const needsFlight = dist > LONG_FLIGHT_THRESHOLD;
  
  if (needsFlight && originAirport && destAirport) {
    const nearbyOriginAirports = Object.values(AIRPORTS)
      .filter(a => haversineDistance(origin, { lat: a.lat, lng: a.lng }) < 200)
      .sort((a, b) => haversineDistance(origin, { lat: a.lat, lng: a.lng }) - haversineDistance(origin, { lat: b.lat, lng: b.lng }));
    
    const nearbyDestAirports = Object.values(AIRPORTS)
      .filter(a => haversineDistance(destination, { lat: a.lat, lng: a.lng }) < 200)
      .sort((a, b) => haversineDistance(destination, { lat: a.lat, lng: a.lng }) - haversineDistance(destination, { lat: b.lat, lng: b.lng }));
    
    for (const origApt of nearbyOriginAirports.slice(0, 3)) {
      for (const destApt of nearbyDestAirports.slice(0, 3)) {
        if (origApt.code === destApt.code) continue;
        
        const flightDist = haversineDistance({ lat: origApt.lat, lng: origApt.lng }, { lat: destApt.lat, lng: destApt.lng });
        const groundFrom = haversineDistance(origin, { lat: origApt.lat, lng: origApt.lng });
        const groundTo = haversineDistance({ lat: destApt.lat, lng: destApt.lng }, destination);
        const groundModeFrom = groundFrom > 50 ? 'driving' : groundFrom > 10 ? 'bus' : 'walking';
        const groundModeTo = groundTo > 50 ? 'train' : groundTo > 10 ? 'bus' : 'walking';
        
        const totalDuration = (groundFrom / (groundModeFrom === 'driving' ? 80 : 60)) * 3600 + estimateFlightTime(flightDist) + (groundTo / (groundModeTo === 'train' ? 120 : 60)) * 3600;
        
        options.push({
          id: `${origApt.code}-${destApt.code}`,
          title: `${origApt.city} (${origApt.code}) → ${destApt.city} (${destApt.code})`,
          description: `${origApt.name} → ${destApt.name}`,
          originAirport: origApt,
          destAirport: destApt,
          segments: buildSegmentsFromOption(origin, destination, origApt, destApt, groundModeFrom, groundModeTo),
          totalDistance: (groundFrom + flightDist + groundTo) * 1000,
          totalDuration,
          isRecommended: origApt.code === originAirport?.code && destApt.code === destAirport?.code,
        });
      }
    }
  }
  
  if (dist > MEDIUM_FLIGHT_THRESHOLD) {
    const groundMode = dist > 300 ? 'train' : dist > 100 ? 'bus' : 'walking';
    const groundTime = groundMode === 'train' ? estimateTrainTime(dist) : groundMode === 'bus' ? estimateBusTime(dist) : (dist / 5) * 3600;
    
    options.push({
      id: 'ground-only',
      title: `${TRANSPORT_MODES.find(m => m.id === groundMode)?.icon || '🚗'} Viaje terrestre`,
      description: `${TRANSPORT_MODES.find(m => m.id === groundMode)?.label || 'Carretera'} directo`,
      segments: [{ id: 'ground-direct', from: { ...origin, name: origin.name }, to: { ...destination, name: destination.name }, mode: groundMode }],
      totalDistance: dist * 1000,
      totalDuration: groundTime,
      isRecommended: false,
    });
  }
  
  options.sort((a, b) => a.totalDuration - b.totalDuration);
  if (options.length > 0) options[0].isRecommended = true;
  
  return options;
}

function buildSegmentsFromOption(origin, destination, originAirport, destAirport, groundModeFrom, groundModeTo) {
  const segments = [];
  const distToAirport = haversineDistance(origin, { lat: originAirport.lat, lng: originAirport.lng });
  
  segments.push({
    id: 'to-airport',
    from: { ...origin, name: origin.name },
    to: { lat: originAirport.lat, lng: originAirport.lng, name: `${originAirport.city} - ${originAirport.name}` },
    mode: distToAirport > 30 ? 'driving' : distToAirport > 3 ? 'bus' : 'walking',
  });
  
  const flightDist = haversineDistance({ lat: originAirport.lat, lng: originAirport.lng }, { lat: destAirport.lat, lng: destAirport.lng });
  
  segments.push({
    id: 'flight',
    from: { lat: originAirport.lat, lng: originAirport.lng, name: `${originAirport.city} - ${originAirport.name}` },
    to: { lat: destAirport.lat, lng: destAirport.lng, name: `${destAirport.city} - ${destAirport.name}` },
    mode: 'flight',
    distance: flightDist * 1000,
    duration: estimateFlightTime(flightDist),
  });
  
  const distFromAirport = haversineDistance({ lat: destAirport.lat, lng: destAirport.lng }, destination);
  
  segments.push({
    id: 'from-airport',
    from: { lat: destAirport.lat, lng: destAirport.lng, name: `${destAirport.city} - ${destAirport.name}` },
    to: { ...destination, name: destination.name },
    mode: distFromAirport > 30 ? 'train' : distFromAirport > 3 ? 'bus' : 'walking',
  });
  
  return segments;
}

export function finalizeSegments(segments) {
  return segments.map(seg => {
    if (seg.mode === 'flight') {
      seg.coordinates = [[seg.from.lng, seg.from.lat], [seg.to.lng, seg.to.lat]];
      seg.distance = haversineDistance(seg.from, seg.to) * 1000;
      seg.duration = seg.duration || estimateFlightTime(seg.distance / 1000);
    } else if (seg.mode === 'walking' || seg.mode === 'bicycle') {
      seg.coordinates = [[seg.from.lng, seg.from.lat], [seg.to.lng, seg.to.lat]];
      seg.distance = haversineDistance(seg.from, seg.to) * 1000;
      seg.duration = (seg.distance / 1000 / (seg.mode === 'walking' ? 5 : 15)) * 3600;
    } else if (seg.mode === 'train') {
      seg.coordinates = [[seg.from.lng, seg.from.lat], [seg.to.lng, seg.to.lat]];
      seg.distance = haversineDistance(seg.from, seg.to) * 1000;
      seg.duration = estimateTrainTime(seg.distance / 1000);
    } else {
      seg.coordinates = [[seg.from.lng, seg.from.lat], [seg.to.lng, seg.to.lat]];
      seg.distance = haversineDistance(seg.from, seg.to) * 1000;
      seg.duration = estimateBusTime(seg.distance / 1000);
    }
    seg.photos = seg.photos || [];
    return seg;
  });
}

export function getSuggestedMode(distanceKm) {
  if (distanceKm < 5) return 'walking';
  if (distanceKm < 20) return 'bicycle';
  if (distanceKm < 100) return 'bus';
  if (distanceKm < 300) return 'train';
  if (distanceKm < 600) return 'flixbus';
  return 'flight';
}