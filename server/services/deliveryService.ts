import { queryOne } from '../db/database.js';

// Haversine formula to compute great-circle distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function validateDeliveryLocation(customerLat?: number, customerLon?: number, pincode?: string): {
  isEligible: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  deliveryCharge: number;
  estimatedTime: string;
  error?: string;
} {
  const settingsRows = queryOne<{ value: string }>(
    "SELECT value FROM store_settings WHERE key = 'delivery_radius_km'"
  );
  const maxRadiusKm = settingsRows ? parseFloat(settingsRows.value) : 12;

  const latRow = queryOne<{ value: string }>("SELECT value FROM store_settings WHERE key = 'shop_latitude'");
  const lonRow = queryOne<{ value: string }>("SELECT value FROM store_settings WHERE key = 'shop_longitude'");
  const shopLat = latRow ? parseFloat(latRow.value) : 12.9716;
  const shopLon = lonRow ? parseFloat(lonRow.value) : 77.5946;

  let distanceKm = 5.0; // Default simulated distance if no coords

  if (customerLat && customerLon) {
    distanceKm = calculateDistanceKm(shopLat, shopLon, customerLat, customerLon);
  } else if (pincode) {
    // Deterministic realistic distance hash for local Bangalore pincodes
    const pin = parseInt(pincode.replace(/\D/g, ''), 10) || 560001;
    // Pincodes starting with 560xxx are local Bangalore
    if (pincode.startsWith('560')) {
      const offset = (pin % 15) * 0.8; // 0 to 12 km
      distanceKm = Math.round((2.5 + offset) * 10) / 10;
    } else {
      // Non-Bangalore pincode: outside local 12 km radius
      distanceKm = 24.5;
    }
  }

  const isEligible = distanceKm <= maxRadiusKm;

  return {
    isEligible,
    distanceKm,
    maxRadiusKm,
    deliveryCharge: isEligible ? 50 : 0,
    estimatedTime: isEligible 
      ? (distanceKm <= 5 ? 'Same-day express delivery (within 3-5 hours)' : 'Next-day delivery (within 24 hours)') 
      : 'Beyond 12 km local delivery limit',
    error: isEligible 
      ? undefined 
      : `Delivery Unavailable: Your address is ${distanceKm} km away. We currently offer boutique delivery only within a ${maxRadiusKm} km radius from our store.`
  };
}
