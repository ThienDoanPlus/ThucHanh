import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { applyUrlFilters } from '../store/slices/filterSlice';
import {
  ColorTone,
  FaceShape,
  FilterState,
  FrameMaterial,
  FrameStyle,
  GenderTarget,
  PriceRange,
} from '../types/eyewear';

function isEnumValue<T extends Record<string, string>>(enumObj: T, val: string | null): val is T[keyof T] {
  return val !== null && Object.values(enumObj).includes(val);
}

export function useUrlFilterSync(enabled: boolean): void {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => state.filter);
  const location = useLocation();
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(location.search);
    const partial: Partial<FilterState> = {};

    const faceShape = params.get('faceShape');
    const frameStyle = params.get('frameStyle');
    const material = params.get('material');
    const gender = params.get('gender');
    const colorTone = params.get('colorTone');
    const priceRange = params.get('priceRange');
    const q = params.get('q');

    if (isEnumValue(FaceShape, faceShape)) partial.faceShape = faceShape;
    if (isEnumValue(FrameStyle, frameStyle)) partial.frameStyle = frameStyle;
    if (isEnumValue(FrameMaterial, material)) partial.material = material;
    if (isEnumValue(GenderTarget, gender)) partial.gender = gender;
    if (isEnumValue(ColorTone, colorTone)) partial.colorTone = colorTone;
    if (isEnumValue(PriceRange, priceRange)) partial.priceRange = priceRange;
    if (q) partial.searchQuery = q;

    if (Object.keys(partial).length > 0) {
      dispatch(applyUrlFilters(partial));
    }
  }, [dispatch, enabled, location.search]);

  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams();
    if (filter.faceShape !== FaceShape.ALL) params.set('faceShape', filter.faceShape);
    if (filter.frameStyle !== FrameStyle.ALL) params.set('frameStyle', filter.frameStyle);
    if (filter.material !== FrameMaterial.ALL) params.set('material', filter.material);
    if (filter.gender !== GenderTarget.ALL) params.set('gender', filter.gender);
    if (filter.colorTone !== ColorTone.ALL) params.set('colorTone', filter.colorTone);
    if (filter.priceRange !== PriceRange.ALL) params.set('priceRange', filter.priceRange);
    if (filter.searchQuery.trim()) params.set('q', filter.searchQuery.trim());

    const nextSearch = params.toString();
    const target = nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname;
    const current = `${location.pathname}${location.search}`;
    if (target !== current) {
      navigate(target, { replace: true });
    }
  }, [enabled, filter, location.pathname, location.search, navigate]);
}
