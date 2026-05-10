export const AIRPORTS = {
  charleroi: {
    code: 'CRL',
    name: 'Charleroi Airport',
    city: 'Charleroi',
    country: 'Belgium',
    lat: 50.46,
    lng: 4.45,
    isRyanair: true,
  },
  chipol: {
    code: 'AMS',
    name: 'Amsterdam Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.31,
    lng: 4.76,
    isMajor: true,
  },
  santiago: {
    code: 'SCL',
    name: 'Santiago de Chile',
    city: 'Santiago',
    country: 'Chile',
    lat: -33.39,
    lng: -70.79,
    isMajor: true,
  },
  treviso: {
    code: 'TSF',
    name: 'Treviso Airport',
    city: 'Treviso',
    country: 'Italy',
    lat: 45.65,
    lng: 12.19,
    isRyanair: true,
  },
  vienna: {
    code: 'VIE',
    name: 'Vienna International',
    city: 'Vienna',
    country: 'Austria',
    lat: 48.11,
    lng: 16.57,
    isMajor: true,
  },
  budapest: {
    code: 'BUD',
    name: 'Budapest Ferenc Liszt',
    city: 'Budapest',
    country: 'Hungary',
    lat: 47.43,
    lng: 19.26,
    isMajor: true,
  },
  maastricht: {
    code: 'MST',
    name: 'Maastricht Aachen',
    city: 'Maastricht',
    country: 'Netherlands',
    lat: 50.91,
    lng: 5.77,
    isRyanair: true,
  },
  eindhoven: {
    code: 'EIN',
    name: 'Eindhoven Airport',
    city: 'Eindhoven',
    country: 'Netherlands',
    lat: 51.45,
    lng: 5.39,
    isRyanair: true,
  },
  brussels: {
    code: 'BRU',
    name: 'Brussels Airport',
    city: 'Brussels',
    country: 'Belgium',
    lat: 50.90,
    lng: 4.48,
    isMajor: true,
  },
  dusseldorf: {
    code: 'DUS',
    name: 'Düsseldorf Airport',
    city: 'Düsseldorf',
    country: 'Germany',
    lat: 51.28,
    lng: 6.77,
    isMajor: true,
  },
};

export function searchAirports(query) {
  const q = query.toLowerCase();
  return Object.values(AIRPORTS)
    .filter((airport) => {
      return (
        airport.city.toLowerCase().includes(q) ||
        airport.name.toLowerCase().includes(q) ||
        airport.code.toLowerCase().includes(q) ||
        airport.country.toLowerCase().includes(q)
      );
    })
    .map((airport) => ({
      ...airport,
      key: airport.code.toLowerCase(),
      display: `${airport.city} (${airport.code}) - ${airport.name}`,
      name: airport.city,
      type: 'airport',
    }));
}

export function findNearestAirport(lat, lng, maxDistance = 200) {
  let nearest = null;
  let minDist = Infinity;

  for (const airport of Object.values(AIRPORTS)) {
    const dist = haversineDistance(lat, lng, airport.lat, airport.lng);
    if (dist < minDist && dist < maxDistance) {
      minDist = dist;
      nearest = { ...airport, distance: dist };
    }
  }

  return nearest;
}

export function getAirportsNearCity(cityQuery) {
  const q = cityQuery.toLowerCase();
  
  const cities = {
    'maastricht': ['maastricht', 'eindhoven', 'chipol'],
    'eindhoven': ['eindhoven', 'maastricht', 'chipol'],
    'amsterdam': ['chipol', 'eindhoven', 'maastricht'],
    'brussels': ['brussels', 'charleroi'],
    'charleroi': ['charleroi', 'brussels'],
    'santiago': ['santiago'],
    'vienna': ['vienna'],
    'budapest': ['budapest'],
    'treviso': ['treviso'],
  };

  const relatedKeys = cities[q] || [];
  
  return relatedKeys.map(key => AIRPORTS[key]).filter(Boolean);
}

export function getCityAirports(cityName) {
  const q = cityName.toLowerCase();
  return Object.values(AIRPORTS).filter(airport => 
    airport.city.toLowerCase().includes(q)
  );
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