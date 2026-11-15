import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ColorTone,
  FaceShape,
  FilterState,
  FrameMaterial,
  FrameStyle,
  GenderTarget,
  PriceRange,
  Product,
} from '../../types/eyewear';

export const initialFilterState: FilterState = {
  faceShape: FaceShape.ALL,
  frameStyle: FrameStyle.ALL,
  material: FrameMaterial.ALL,
  gender: GenderTarget.ALL,
  colorTone: ColorTone.ALL,
  priceRange: PriceRange.ALL,
  searchQuery: '',
};

const filterSlice = createSlice({
  name: 'filter',
  initialState: initialFilterState,
  reducers: {
    setFaceShape(state, action: PayloadAction<FaceShape>) {
      state.faceShape = action.payload;
    },
    setFrameStyle(state, action: PayloadAction<FrameStyle>) {
      state.frameStyle = action.payload;
    },
    setMaterial(state, action: PayloadAction<FrameMaterial>) {
      state.material = action.payload;
    },
    setGender(state, action: PayloadAction<GenderTarget>) {
      state.gender = action.payload;
    },
    setColorTone(state, action: PayloadAction<ColorTone>) {
      state.colorTone = action.payload;
    },
    setPriceRange(state, action: PayloadAction<PriceRange>) {
      state.priceRange = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    applyUrlFilters(state, action: PayloadAction<Partial<FilterState>>) {
      return { ...initialFilterState, ...action.payload };
    },
    resetAllFilters() {
      return initialFilterState;
    },
  },
});

export function filterProductsBy6Dimensions(products: Product[], filters: FilterState): Product[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    if (!product.isActive) return false;

    if (
      filters.faceShape !== FaceShape.ALL &&
      !product.suitableFaces.includes(filters.faceShape)
    ) {
      return false;
    }

    if (filters.frameStyle !== FrameStyle.ALL && product.frameStyle !== filters.frameStyle) {
      return false;
    }

    if (filters.material !== FrameMaterial.ALL && product.material !== filters.material) {
      return false;
    }

    if (filters.gender !== GenderTarget.ALL && product.gender !== filters.gender) {
      return false;
    }

    if (filters.colorTone !== ColorTone.ALL && product.colorTone !== filters.colorTone) {
      return false;
    }

    if (filters.priceRange !== PriceRange.ALL) {
      if (filters.priceRange === PriceRange.UNDER_500K && product.price >= 500_000) return false;
      if (
        filters.priceRange === PriceRange.BETWEEN_500K_1M &&
        (product.price < 500_000 || product.price > 1_000_000)
      ) {
        return false;
      }
      if (
        filters.priceRange === PriceRange.BETWEEN_1M_2M &&
        (product.price <= 1_000_000 || product.price > 2_000_000)
      ) {
        return false;
      }
      if (filters.priceRange === PriceRange.OVER_2M && product.price <= 2_000_000) return false;
    }

    if (query) {
      const hay = `${product.nameVi} ${product.nameEn} ${product.sku}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }

    return true;
  });
}

export const {
  setFaceShape,
  setFrameStyle,
  setMaterial,
  setGender,
  setColorTone,
  setPriceRange,
  setSearchQuery,
  applyUrlFilters,
  resetAllFilters,
} = filterSlice.actions;

export default filterSlice.reducer;
