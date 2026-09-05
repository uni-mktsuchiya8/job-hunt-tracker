// Free, keyless helpers for turning a Japanese address into its nearest
// train station:
//   1. GSI (国土地理院) address search — geocodes address text to lat/lng.
//   2. HeartRails Express — finds the nearest station(s) to a lat/lng.
// Both are public APIs with no signup required.

export interface NearestStation {
  name: string;
  line: string;
  distance: string | null;
}

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    geometry: { coordinates: [number, number] };
  }>;
  const first = data?.[0];
  if (!first) return null;
  const [lng, lat] = first.geometry.coordinates;
  return { lat, lng };
}

export async function findNearestStation(
  lat: number,
  lng: number,
): Promise<NearestStation | null> {
  const url = `https://express.heartrails.com/api/json?method=getStations&x=${lng}&y=${lat}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    response?: {
      station?: Array<{ name: string; line: string; distance?: string }>;
    };
  };
  const first = data?.response?.station?.[0];
  if (!first) return null;
  return { name: first.name, line: first.line, distance: first.distance ?? null };
}

export async function nearestStationForAddress(
  address: string,
): Promise<NearestStation | null> {
  const coords = await geocodeAddress(address);
  if (!coords) return null;
  return findNearestStation(coords.lat, coords.lng);
}
