export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliveryPresetZone {
  id: string;
  labelVi: string;
  labelEn: string;
  coords: Coordinates;
}

export const STORE_ORIGIN: Coordinates = {
  lat: 10.8231,
  lng: 106.6458,
};

export const STORE_ADDRESS_VI = '294 Phạm Văn Bạch, Phường Tân Sơn, Quận Tân Bình, TP.HCM';
export const STORE_ADDRESS_EN = '294 Pham Van Bach, Tan Son Ward, Tan Binh District, HCMC';

// Circuity multiplier approximating urban road routing in Vietnam from straight-line Haversine distance
const URBAN_ROAD_CIRCUITY_FACTOR = 1.35;
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateUrbanRoadDistanceKm(
  destination: Coordinates | null | undefined,
  origin: Coordinates = STORE_ORIGIN
): number {
  if (
    !destination ||
    typeof destination.lat !== 'number' ||
    typeof destination.lng !== 'number' ||
    Number.isNaN(destination.lat) ||
    Number.isNaN(destination.lng) ||
    destination.lat < -90 ||
    destination.lat > 90 ||
    destination.lng < -180 ||
    destination.lng > 180
  ) {
    throw new Error('INVALID_COORDINATES');
  }

  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(a));

  return Number((EARTH_RADIUS_KM * c * URBAN_ROAD_CIRCUITY_FACTOR).toFixed(2));
}

export function getShippingFeeByDistance(distanceKm: number): number {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm) || distanceKm < 0) {
    throw new Error('INVALID_DISTANCE');
  }
  if (distanceKm <= 3.0) return 0;
  if (distanceKm <= 10.0) return 25_000;
  if (distanceKm <= 20.0) return 45_000;
  return 70_000;
}

export function getShippingTierKey(distanceKm: number): 'NEAR' | 'URBAN' | 'METRO' | 'PROVINCE' {
  if (distanceKm <= 3.0) return 'NEAR';
  if (distanceKm <= 10.0) return 'URBAN';
  if (distanceKm <= 20.0) return 'METRO';
  return 'PROVINCE';
}

export const DELIVERY_PRESET_ZONES: DeliveryPresetZone[] = [
  {
    id: 'tan-binh-near',
    labelVi: 'Phường 15 / Phạm Văn Bạch, Q. Tân Bình (~1.5 km)',
    labelEn: 'Ward 15 / Pham Van Bach, Tan Binh (~1.5 km)',
    coords: { lat: 10.814, lng: 106.642 },
  },
  {
    id: 'phu-nhuan-govap',
    labelVi: 'Q. Phú Nhuận / Q. Gò Vấp / Tân Phú (~6.5 km)',
    labelEn: 'Phu Nhuan / Go Vap / Tan Phu (~6.5 km)',
    coords: { lat: 10.805, lng: 106.688 },
  },
  {
    id: 'q1-q7-thuduc',
    labelVi: 'Q.1 / Q.7 / TP. Thủ Đức (~15 km)',
    labelEn: 'District 1 / District 7 / Thu Duc (~15 km)',
    coords: { lat: 10.742, lng: 106.721 },
  },
  {
    id: 'cu-chi-tinh',
    labelVi: 'Củ Chi / Bình Dương / Hà Nội / Đà Nẵng (>20 km)',
    labelEn: 'Cu Chi / Binh Duong / Hanoi / Da Nang (>20 km)',
    coords: { lat: 10.973, lng: 106.493 },
  },
];
