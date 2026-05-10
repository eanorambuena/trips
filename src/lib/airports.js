export const AIRPORTS = {
  charleroi: { code: 'CRL', name: 'Charleroi Airport', city: 'Charleroi', country: 'Belgium', lat: 50.46, lng: 4.45, isRyanair: true },
  chipol: { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.31, lng: 4.76, isMajor: true },
  santiago: { code: 'SCL', name: 'Santiago de Chile', city: 'Santiago', country: 'Chile', lat: -33.39, lng: -70.79, isMajor: true },
  ezeiza: { code: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', country: 'Argentina', lat: -34.82, lng: -58.54, isMajor: true },
  treviso: { code: 'TSF', name: 'Treviso Airport', city: 'Treviso', country: 'Italy', lat: 45.65, lng: 12.19, isRyanair: true },
  vienna: { code: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', lat: 48.11, lng: 16.57, isMajor: true },
  budapest: { code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', lat: 47.43, lng: 19.26, isMajor: true },
  maastricht: { code: 'MST', name: 'Maastricht Aachen', city: 'Maastricht', country: 'Netherlands', lat: 50.91, lng: 5.77, isRyanair: true },
  eindhoven: { code: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Netherlands', lat: 51.45, lng: 5.39, isRyanair: true },
  brussels: { code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.90, lng: 4.48, isMajor: true },
  dusseldorf: { code: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany', lat: 51.28, lng: 6.77, isMajor: true },
  cologne: { code: 'CGN', name: 'Cologne Bonn', city: 'Cologne', country: 'Germany', lat: 50.87, lng: 7.17, isMajor: true },
  paris: { code: 'CDG', name: 'Paris CDG', city: 'Paris', country: 'France', lat: 49.01, lng: 2.55, isMajor: true },
  london: { code: 'STN', name: 'London Stansted', city: 'London', country: 'UK', lat: 51.89, lng: 0.24, isRyanair: true },
  milan: { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.63, lng: 8.72, isMajor: true },
  bergamo: { code: 'BGY', name: 'Milan Bergamo', city: 'Bergamo', country: 'Italy', lat: 45.67, lng: 9.70, isRyanair: true },
  rome: { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', lat: 41.80, lng: 12.25, isMajor: true },
  barcelona: { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain', lat: 41.30, lng: 2.08, isMajor: true },
  madrid: { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain', lat: 40.50, lng: -3.57, isMajor: true },
  lisbon: { code: 'LIS', name: 'Lisbon Airport', city: 'Lisbon', country: 'Portugal', lat: 38.78, lng: -9.14, isMajor: true },
  berlin: { code: 'BER', name: 'Berlin BER', city: 'Berlin', country: 'Germany', lat: 52.36, lng: 13.50, isMajor: true },
};

export const CITIES = {
  // Chile
  'santiago': { lat: -33.39, lng: -70.79, name: 'Santiago', country: 'Chile', airport: 'santiago' },
  
  // Argentina
  'buenos aires': { lat: -34.60, lng: -58.38, name: 'Buenos Aires', country: 'Argentina', airport: 'ezeiza' },
  'ezeiza': { lat: -34.82, lng: -58.54, name: 'Ezeiza', country: 'Argentina', airport: 'ezeiza' },
  
  // Netherlands (Países Bajos)
  'maastricht': { lat: 50.91, lng: 5.77, name: 'Maastricht', country: 'Netherlands', airport: 'maastricht' },
  'eindhoven': { lat: 51.45, lng: 5.39, name: 'Eindhoven', country: 'Netherlands', airport: 'eindhoven' },
  'amsterdam': { lat: 52.31, lng: 4.76, name: 'Amsterdam', country: 'Netherlands', airport: 'chipol' },
  'chipol': { lat: 52.31, lng: 4.76, name: 'Amsterdam Schiphol', country: 'Netherlands', airport: 'chipol' },
  'schiphol': { lat: 52.31, lng: 4.76, name: 'Amsterdam Schiphol', country: 'Netherlands', airport: 'chipol' },
  'rotterdam': { lat: 51.92, lng: 4.48, name: 'Rotterdam', country: 'Netherlands', airport: 'chipol' },
  'la haya': { lat: 52.07, lng: 4.30, name: 'La Haya', country: 'Netherlands', airport: 'chipol' },
  'utrecht': { lat: 52.09, lng: 5.11, name: 'Utrecht', country: 'Netherlands', airport: 'chipol' },
  'groningen': { lat: 53.22, lng: 6.57, name: 'Groningen', country: 'Netherlands', airport: 'eindhoven' },
  'tilburg': { lat: 51.56, lng: 5.09, name: 'Tilburg', country: 'Netherlands', airport: 'eindhoven' },
  'arnhem': { lat: 51.99, lng: 5.90, name: 'Arnhem', country: 'Netherlands', airport: 'eindhoven' },
  
  // Belgium (Bélgica)
  'brussels': { lat: 50.90, lng: 4.48, name: 'Brussels', country: 'Belgium', airport: 'brussels' },
  'bruxelles': { lat: 50.90, lng: 4.48, name: 'Brussels', country: 'Belgium', airport: 'brussels' },
  'charleroi': { lat: 50.41, lng: 4.45, name: 'Charleroi', country: 'Belgium', airport: 'charleroi' },
  'arlon': { lat: 49.68, lng: 5.81, name: 'Arlon', country: 'Belgium', airport: 'charleroi' },
  'liege': { lat: 50.64, lng: 5.57, name: 'Liège', country: 'Belgium', airport: 'charleroi' },
  'gante': { lat: 51.05, lng: 3.72, name: 'Gante', country: 'Belgium', airport: 'brussels' },
  'ghent': { lat: 51.05, lng: 3.72, name: 'Gante', country: 'Belgium', airport: 'brussels' },
  'brujas': { lat: 51.21, lng: 3.22, name: 'Brujas', country: 'Belgium', airport: 'brussels' },
  'bruges': { lat: 51.21, lng: 3.22, name: 'Brujas', country: 'Belgium', airport: 'brussels' },
  'antwerp': { lat: 51.22, lng: 4.40, name: 'Amberes', country: 'Belgium', airport: 'brussels' },
  'amberes': { lat: 51.22, lng: 4.40, name: 'Amberes', country: 'Belgium', airport: 'brussels' },
  'namur': { lat: 50.47, lng: 4.87, name: 'Namur', country: 'Belgium', airport: 'charleroi' },
  'mons': { lat: 50.45, lng: 3.95, name: 'Mons', country: 'Belgium', airport: 'charleroi' },
  
  // Germany (Alemania)
  'cologne': { lat: 50.94, lng: 6.96, name: 'Colonia', country: 'Germany', airport: 'cologne' },
  'koln': { lat: 50.94, lng: 6.96, name: 'Colonia', country: 'Germany', airport: 'cologne' },
  'dusseldorf': { lat: 51.23, lng: 6.79, name: 'Düsseldorf', country: 'Germany', airport: 'dusseldorf' },
  'berlin': { lat: 52.52, lng: 13.40, name: 'Berlin', country: 'Germany', airport: 'berlin' },
  'munich': { lat: 48.14, lng: 11.58, name: 'Munich', country: 'Germany', airport: 'dusseldorf' },
  'munchen': { lat: 48.14, lng: 11.58, name: 'Munich', country: 'Germany', airport: 'dusseldorf' },
  'frankfurt': { lat: 50.11, lng: 8.68, name: 'Frankfurt', country: 'Germany', airport: 'dusseldorf' },
  'hamburg': { lat: 53.55, lng: 10.00, name: 'Hamburg', country: 'Germany', airport: 'cologne' },
  'hannover': { lat: 52.38, lng: 9.74, name: 'Hannover', country: 'Germany', airport: 'cologne' },
  'dortmund': { lat: 51.51, lng: 7.47, name: 'Dortmund', country: 'Germany', airport: 'dusseldorf' },
  'essen': { lat: 51.46, lng: 7.01, name: 'Essen', country: 'Germany', airport: 'dusseldorf' },
  'leipzig': { lat: 51.34, lng: 12.37, name: 'Leipzig', country: 'Germany', airport: 'cologne' },
  
  // Austria
  'vienna': { lat: 48.21, lng: 16.37, name: 'Vienna', country: 'Austria', airport: 'vienna' },
  'wien': { lat: 48.21, lng: 16.37, name: 'Vienna', country: 'Austria', airport: 'vienna' },
  'salzburg': { lat: 47.81, lng: 13.05, name: 'Salzburg', country: 'Austria', airport: 'vienna' },
  'innsbruck': { lat: 47.27, lng: 11.40, name: 'Innsbruck', country: 'Austria', airport: 'vienna' },
  'graz': { lat: 47.07, lng: 15.43, name: 'Graz', country: 'Austria', airport: 'vienna' },
  'linz': { lat: 48.31, lng: 14.29, name: 'Linz', country: 'Austria', airport: 'vienna' },
  
  // Hungary
  'budapest': { lat: 47.50, lng: 19.04, name: 'Budapest', country: 'Hungary', airport: 'budapest' },
  'budaest': { lat: 47.50, lng: 19.04, name: 'Budapest', country: 'Hungary', airport: 'budapest' },
  
  // Italy (Italia)
  'treviso': { lat: 45.67, lng: 12.24, name: 'Treviso', country: 'Italy', airport: 'treviso' },
  'verona': { lat: 45.44, lng: 10.99, name: 'Verona', country: 'Italy', airport: 'treviso' },
  'venice': { lat: 45.44, lng: 12.32, name: 'Venice', country: 'Italy', airport: 'treviso' },
  'venecia': { lat: 45.44, lng: 12.32, name: 'Venice', country: 'Italy', airport: 'treviso' },
  'rome': { lat: 41.90, lng: 12.50, name: 'Rome', country: 'Italy', airport: 'rome' },
  'roma': { lat: 41.90, lng: 12.50, name: 'Rome', country: 'Italy', airport: 'rome' },
  'milan': { lat: 45.46, lng: 9.19, name: 'Milan', country: 'Italy', airport: 'milan' },
  'milano': { lat: 45.46, lng: 9.19, name: 'Milan', country: 'Italy', airport: 'milan' },
  'florence': { lat: 43.77, lng: 11.25, name: 'Florence', country: 'Italy', airport: 'rome' },
  'firenze': { lat: 43.77, lng: 11.25, name: 'Florence', country: 'Italy', airport: 'rome' },
  'naples': { lat: 40.85, lng: 14.27, name: 'Naples', country: 'Italy', airport: 'rome' },
  'napoli': { lat: 40.85, lng: 14.27, name: 'Naples', country: 'Italy', airport: 'rome' },
  'bologna': { lat: 44.49, lng: 11.34, name: 'Bologna', country: 'Italy', airport: 'rome' },
  'turin': { lat: 45.07, lng: 7.68, name: 'Turin', country: 'Italy', airport: 'milan' },
  'torino': { lat: 45.07, lng: 7.68, name: 'Turin', country: 'Italy', airport: 'milan' },
  'genoa': { lat: 44.41, lng: 8.93, name: 'Genoa', country: 'Italy', airport: 'milan' },
  'genova': { lat: 44.41, lng: 8.93, name: 'Genoa', country: 'Italy', airport: 'milan' },
  'palermo': { lat: 38.12, lng: 13.36, name: 'Palermo', country: 'Italy', airport: 'rome' },
  'catania': { lat: 37.50, lng: 15.08, name: 'Catania', country: 'Italy', airport: 'rome' },
  
  // UK
  'london': { lat: 51.51, lng: -0.13, name: 'London', country: 'UK', airport: 'london' },
  'dover': { lat: 51.13, lng: 1.31, name: 'Dover', country: 'UK', airport: 'london' },
  'manchester': { lat: 53.48, lng: -2.24, name: 'Manchester', country: 'UK', airport: 'london' },
  'edinburgh': { lat: 55.95, lng: -3.19, name: 'Edinburgh', country: 'UK', airport: 'london' },
  
  // France (Francia)
  'paris': { lat: 48.86, lng: 2.35, name: 'Paris', country: 'France', airport: 'paris' },
  'calais': { lat: 50.95, lng: 1.86, name: 'Calais', country: 'France', airport: 'paris' },
  'lyon': { lat: 45.76, lng: 4.84, name: 'Lyon', country: 'France', airport: 'paris' },
  'marseille': { lat: 43.30, lng: 5.37, name: 'Marseille', country: 'France', airport: 'paris' },
  'toulouse': { lat: 43.60, lng: 1.44, name: 'Toulouse', country: 'France', airport: 'paris' },
  'nice': { lat: 43.71, lng: 7.26, name: 'Nice', country: 'France', airport: 'paris' },
  'bordeaux': { lat: 44.84, lng: -0.58, name: 'Bordeaux', country: 'France', airport: 'paris' },
  'strasbourg': { lat: 48.57, lng: 7.75, name: 'Strasbourg', country: 'France', airport: 'paris' },
  
  // Luxembourg
  'luxembourg': { lat: 49.61, lng: 6.13, name: 'Luxembourg', country: 'Luxembourg', airport: 'charleroi' },
  
  // Spain (España)
  'madrid': { lat: 40.42, lng: -3.70, name: 'Madrid', country: 'Spain', airport: 'madrid' },
  'barcelona': { lat: 41.39, lng: 2.17, name: 'Barcelona', country: 'Spain', airport: 'barcelona' },
  'valencia': { lat: 39.47, lng: -0.38, name: 'Valencia', country: 'Spain', airport: 'barcelona' },
  'seville': { lat: 37.39, lng: -5.99, name: 'Seville', country: 'Spain', airport: 'madrid' },
  'sevilla': { lat: 37.39, lng: -5.99, name: 'Seville', country: 'Spain', airport: 'madrid' },
  'bilbao': { lat: 43.26, lng: -2.93, name: 'Bilbao', country: 'Spain', airport: 'madrid' },
  'malaga': { lat: 36.72, lng: -4.42, name: 'Málaga', country: 'Spain', airport: 'madrid' },
  
  // Portugal
  'lisbon': { lat: 38.72, lng: -9.14, name: 'Lisbon', country: 'Portugal', airport: 'lisbon' },
  'lisboa': { lat: 38.72, lng: -9.14, name: 'Lisbon', country: 'Portugal', airport: 'lisbon' },
  'porto': { lat: 41.15, lng: -8.61, name: 'Porto', country: 'Portugal', airport: 'lisbon' },
};

export function searchAirports(query) {
  const q = query.toLowerCase();
  return Object.values(AIRPORTS)
    .filter((a) => a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))
    .map((a) => ({ ...a, key: a.code.toLowerCase(), display: `${a.city} (${a.code})`, name: a.city, type: 'airport' }));
}

export function searchCities(query) {
  const q = query.toLowerCase();
  return Object.values(CITIES)
    .filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
    .map((c) => ({ ...c, type: 'city', display: `${c.name}, ${c.country}`, key: c.name.toLowerCase().replace(/\s+/g, '') }));
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

export function getCityAirports(cityName) {
  const q = cityName.toLowerCase();
  return Object.values(AIRPORTS).filter((a) => a.city.toLowerCase().includes(q));
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}