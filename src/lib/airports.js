export const AIRPORTS = {
  charleroi: {
    code: 'CRL',
    name: 'Charleroi Airport',
    city: 'Charleroi',
    country: 'Belgium',
    lat: 50.46,
    lng: 4.45,
  },
  chipol: {
    code: 'AMS',
    name: 'Amsterdam Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.31,
    lng: 4.76,
  },
  santiago: {
    code: 'SCL',
    name: 'Aeropuerto de Santiago',
    city: 'Santiago',
    country: 'Chile',
    lat: -33.39,
    lng: -70.79,
  },
  treviso: {
    code: 'TSF',
    name: 'Treviso Airport',
    city: 'Treviso',
    country: 'Italy',
    lat: 45.65,
    lng: 12.19,
  },
  vienna: {
    code: 'VIE',
    name: 'Vienna International Airport',
    city: 'Vienna',
    country: 'Austria',
    lat: 48.11,
    lng: 16.57,
  },
  budapest: {
    code: 'BUD',
    name: 'Budapest Ferenc Liszt',
    city: 'Budapest',
    country: 'Hungary',
    lat: 47.43,
    lng: 19.26,
  },
};

export function searchAirports(query) {
  const q = query.toLowerCase();
  return Object.entries(AIRPORTS)
    .filter(([key, airport]) => {
      return (
        airport.city.toLowerCase().includes(q) ||
        airport.name.toLowerCase().includes(q) ||
        airport.code.toLowerCase().includes(q) ||
        key.toLowerCase().includes(q)
      );
    })
    .map(([key, airport]) => ({
      ...airport,
      key,
      display: `${airport.city} (${airport.code}) - ${airport.name}`,
      name: airport.city,
      type: 'airport',
    }));
}

export function findNearestAirport(lat, lng) {
  let nearest = null;
  let minDist = Infinity;

  for (const [key, airport] of Object.entries(AIRPORTS)) {
    const dist = haversineDistance(lat, lng, airport.lat, airport.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = { ...airport, key };
    }
  }

  return nearest;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}