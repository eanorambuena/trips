const STORAGE_KEY = 'travel_routes_trips';

export function getTrips() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTrip(trip) {
  const trips = getTrips();
  const existingIndex = trips.findIndex((t) => t.id === trip.id);

  if (existingIndex >= 0) {
    trips[existingIndex] = { ...trip, updatedAt: Date.now() };
  } else {
    trips.unshift({ ...trip, createdAt: Date.now(), updatedAt: Date.now() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  return trip;
}

export function deleteTrip(id) {
  const trips = getTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function getTripById(id) {
  return getTrips().find((t) => t.id === id);
}

export function generateTripId() {
  return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSegmentId() {
  return `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generatePhotoId() {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}