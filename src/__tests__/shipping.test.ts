import { describe, expect, it } from 'vitest';
import {
  calculateUrbanRoadDistanceKm,
  getShippingFeeByDistance,
  STORE_ORIGIN,
} from '../utils/shipping';

describe('Shipping Distance & Fee Engine', () => {
  it('returns 0 VND for distances <= 3.0 km', () => {
    expect(getShippingFeeByDistance(0)).toBe(0);
    expect(getShippingFeeByDistance(3.0)).toBe(0);
  });

  it('returns 25,000 VND for distances between 3.01 km and 10.0 km', () => {
    expect(getShippingFeeByDistance(3.01)).toBe(25_000);
    expect(getShippingFeeByDistance(10.0)).toBe(25_000);
  });

  it('returns 45,000 VND for distances between 10.01 km and 20.0 km', () => {
    expect(getShippingFeeByDistance(10.01)).toBe(45_000);
    expect(getShippingFeeByDistance(20.0)).toBe(45_000);
  });

  it('returns 70,000 VND for distances > 20.0 km', () => {
    expect(getShippingFeeByDistance(20.01)).toBe(70_000);
    expect(getShippingFeeByDistance(120)).toBe(70_000);
  });

  it('throws on invalid distances or invalid coordinates', () => {
    expect(() => getShippingFeeByDistance(-1)).toThrow('INVALID_DISTANCE');
    expect(() => getShippingFeeByDistance(Number.NaN)).toThrow('INVALID_DISTANCE');
    expect(() => calculateUrbanRoadDistanceKm(null)).toThrow('INVALID_COORDINATES');
    expect(() => calculateUrbanRoadDistanceKm({ lat: 95, lng: 106 })).toThrow('INVALID_COORDINATES');
  });

  it('calculates 0 km at flagship origin and applies 1.35 urban road factor', () => {
    expect(calculateUrbanRoadDistanceKm(STORE_ORIGIN)).toBe(0);
    const dist = calculateUrbanRoadDistanceKm({ lat: 10.7769, lng: 106.7009 });
    expect(dist).toBeGreaterThan(7);
    expect(dist).toBeLessThan(15);
  });
});
