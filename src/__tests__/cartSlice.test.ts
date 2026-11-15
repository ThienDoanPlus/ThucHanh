import { describe, expect, it } from 'vitest';
import cartReducer, {
  addToCart,
  buildCartKey,
  initialCartState,
  mergeGuestCart,
  updateQuantity,
} from '../store/slices/cartSlice';
import { LensOptionType } from '../types/eyewear';

describe('cartSlice Redux Reducer', () => {
  const samplePayload = {
    productId: 'prod-kyoto-titanium',
    slug: 'kyoto-beta-titanium-square',
    nameVi: 'Gọng Kính Kyoto',
    nameEn: 'Kyoto Frame',
    imageUrl: '/img.jpg',
    unitPrice: 1_450_000,
    lensType: LensOptionType.FRAME_ONLY,
    lensPrice: 0,
    quantity: 1,
  };

  it('keeps isCartOpen false, increments quantity for identical product+lens, and updates lastCartAddedAt', () => {
    let state = cartReducer({ ...initialCartState, items: [] }, addToCart(samplePayload));
    expect(state.isCartOpen).toBe(false);
    expect(state.lastCartAddedAt).not.toBeNull();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);

    state = cartReducer(state, addToCart(samplePayload));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.isCartOpen).toBe(false);
  });

  it('removes item when updateQuantity receives quantity <= 0', () => {
    const key = buildCartKey(samplePayload.productId, samplePayload.lensType);
    let state = cartReducer({ ...initialCartState, items: [] }, addToCart(samplePayload));
    state = cartReducer(state, updateQuantity({ cartKey: key, quantity: 0 }));
    expect(state.items).toHaveLength(0);
  });

  it('merges guest cart items accurately upon login', () => {
    const key = buildCartKey(samplePayload.productId, samplePayload.lensType);
    const existingState = {
      items: [{ ...samplePayload, cartKey: key, quantity: 1 }],
      isCartOpen: false,
      lastCartAddedAt: null,
    };
    const merged = cartReducer(
      existingState,
      mergeGuestCart([{ ...samplePayload, cartKey: key, quantity: 2 }])
    );
    expect(merged.items).toHaveLength(1);
    expect(merged.items[0].quantity).toBe(3);
  });
});
