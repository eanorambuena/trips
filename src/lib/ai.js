import { CITIES, AIRPORTS } from './airports';

export function hasApiKey() {
  return false;
}

export function setApiKey(key) {}

export function getApiKey() {
  return '';
}

const PREFERENCES_MAP = {
  'vuelo': 'flight', 'avión': 'flight', 'flight': 'flight', 'plane': 'flight',
  'tren': 'train', 'train': 'train', 'rail': 'train',
  'bus': 'bus', 'autobús': 'bus', 'autobus': 'bus',
  'flixbus': 'flixbus', 'flix': 'flixbus',
  'coche': 'driving', 'carro': 'driving', 'driving': 'driving', 'car': 'driving', 'auto': 'driving',
  'caminar': 'walking', 'walking': 'walking', 'pie': 'walking', 'a pie': 'walking',
  'bici': 'bicycle', 'bicycle': 'bicycle', 'bike': 'bicycle',
};

function extractCity(text) {
  const lower = text.toLowerCase().trim();
  
  const aliases = {
    'chipol': 'amsterdam', 'schiphol': 'amsterdam', 'ams': 'amsterdam',
    'wien': 'vienna', 'viena': 'vienna',
    'roma': 'rome', 'ciudad del Vaticano': 'rome',
    'milano': 'milan',
    'bruxelles': 'brussels', 'bxl': 'brussels',
    'lisboa': 'lisbon',
    'ba': 'buenos aires', 'buenosaires': 'buenos aires',
    'munchen': 'munich',
  };

  for (const [alias, target] of Object.entries(aliases)) {
    if (lower.includes(alias)) {
      return CITIES[target];
    }
  }

  for (const [key, city] of Object.entries(CITIES)) {
    if (lower.includes(key)) {
      return city;
    }
  }

  for (const [key, airport] of Object.entries(AIRPORTS)) {
    if (lower.includes(airport.code.toLowerCase()) || lower.includes(airport.name.toLowerCase())) {
      return { ...airport, name: airport.city, display: `${airport.city}, ${airport.country}`, type: 'airport' };
    }
  }

  return null;
}

function extractPreferences(text) {
  const lower = text.toLowerCase();
  const prefs = new Set();
  for (const [key, value] of Object.entries(PREFERENCES_MAP)) {
    if (lower.includes(key)) {
      prefs.add(value);
    }
  }
  return Array.from(prefs);
}

function extractWaypoints(text, originName, destName) {
  const lower = text.toLowerCase();
  const viaWords = ['via', 'through', 'pasando', 'stopping', 'escala', 'en route', 'passing', 'through'];
  const hasVia = viaWords.some(v => lower.includes(v));
  
  if (!hasVia) return [];

  const waypoints = [];
  const exclude = [originName?.toLowerCase(), destName?.toLowerCase()].filter(Boolean);

  for (const [key, city] of Object.entries(CITIES)) {
    if (exclude.some(e => key.includes(e) || e?.includes(key))) continue;
    if (lower.includes(key)) {
      waypoints.push(city);
    }
  }

  return waypoints;
}

function parseRoute(text) {
  const separators = /(?:→|to|verso|hacia|\s+-\s+|\s+a\s+)/i;
  const parts = text.split(separators).map(p => p.trim()).filter(Boolean);
  
  return parts;
}

export async function parseNaturalLanguage(text) {
  const parts = parseRoute(text);
  
  let origin = null;
  let destination = null;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const city = extractCity(part);
    
    if (!origin) {
      origin = city;
    } else if (!destination) {
      destination = city;
    }
  }

  if (!origin) {
    origin = extractCity(text);
  }

  if (!destination) {
    const withoutOrigin = text.replace(new RegExp(origin?.name || '', 'gi'), '').trim();
    destination = extractCity(withoutOrigin) || extractCity(text.split(/(?:→|to|verso|hacia)\s*/i).pop() || '');
  }

  if (!origin) {
    throw new Error('No pude entender el origen. Intenta ser más específico. Ej: "Santiago to Amsterdam"');
  }
  
  if (!destination) {
    throw new Error('No pude entender el destino. Intenta ser más específico. Ej: "Santiago to Amsterdam"');
  }

  const preferences = extractPreferences(text);
  const waypoints = extractWaypoints(text, origin.name, destination.name);

  const originData = {
    ...origin,
    display: `${origin.name}, ${origin.country}`,
    type: origin.type || 'city',
    searchText: origin.name,
  };

  const destData = {
    ...destination,
    display: `${destination.name}, ${destination.country}`,
    type: destination.type || 'city',
    searchText: destination.name,
  };

  return {
    origin: originData,
    destination: destData,
    waypoints: waypoints.map(w => ({ ...w, display: `${w.name}, ${w.country}`, type: 'city', searchText: w.name })),
    preferences,
    notes: '',
    rawText: text,
  };
}

export const AI_PROMPT_EXAMPLES = [
  "Santiago → Amsterdam via Brussels",
  "Santiago to Maastricht, stopping in Amsterdam",
  "Buenos Aires to Madrid",
  "Charleroi to Budapest via Vienna",
  "Eindhoven to Treviso",
  "Amsterdam to Rome via Milan",
];