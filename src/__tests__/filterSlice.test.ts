import { describe, expect, it } from 'vitest';
import { INITIAL_PRODUCTS } from '../data/products';
import filterReducer, {
  filterProductsBy6Dimensions,
  initialFilterState,
  resetAllFilters,
  setColorTone,
  setFaceShape,
  setFrameStyle,
  setGender,
  setMaterial,
  setPriceRange,
} from '../store/slices/filterSlice';
import {
  ColorTone,
  FaceShape,
  FrameMaterial,
  FrameStyle,
  GenderTarget,
  PriceRange,
} from '../types/eyewear';

describe('filterSlice & 6-Dimensional Eyewear Filter', () => {
  it('filters simultaneously across all 6 dimensions and resets cleanly', () => {
    let state = filterReducer(initialFilterState, setFaceShape(FaceShape.ROUND));
    state = filterReducer(state, setFrameStyle(FrameStyle.SQUARE));
    state = filterReducer(state, setMaterial(FrameMaterial.TITANIUM));
    state = filterReducer(state, setGender(GenderTarget.UNISEX));
    state = filterReducer(state, setColorTone(ColorTone.SILVER));
    state = filterReducer(state, setPriceRange(PriceRange.BETWEEN_1M_2M));

    const results = filterProductsBy6Dimensions(INITIAL_PRODUCTS, state);
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('kyoto-beta-titanium-square');

    const resetState = filterReducer(state, resetAllFilters());
    expect(resetState).toEqual(initialFilterState);
    expect(filterProductsBy6Dimensions(INITIAL_PRODUCTS, resetState)).toHaveLength(
      INITIAL_PRODUCTS.length
    );
  });
});
