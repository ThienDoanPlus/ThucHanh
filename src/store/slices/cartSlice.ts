import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, LensOptionType, PrescriptionSpec } from '../../types/eyewear';

const GUEST_CART_STORAGE_KEY = 'lumina_guest_cart_v1';

export interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  lastCartAddedAt: number | null;
}

function loadInitialCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function persistCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota restrictions
  }
}

export function buildCartKey(
  productId: string,
  lensType: LensOptionType,
  prescription?: PrescriptionSpec
): string {
  const rxSignature = prescription
    ? `${prescription.odSph}|${prescription.odCyl}|${prescription.osSph}|${prescription.osCyl}|${prescription.pdMm}`
    : 'NO_RX';
  return `${productId}__${lensType}__${rxSignature}`;
}

export const initialCartState: CartState = {
  items: loadInitialCartItems(),
  isCartOpen: false,
  lastCartAddedAt: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    addToCart(state, action: PayloadAction<Omit<CartItem, 'cartKey'>>) {
      const cartKey = buildCartKey(
        action.payload.productId,
        action.payload.lensType,
        action.payload.prescription
      );
      const existing = state.items.find((item) => item.cartKey === cartKey);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push({ ...action.payload, cartKey });
      }
      // Never auto-open CartDrawer on Add-to-Cart to preserve browsing flow
      state.lastCartAddedAt = Date.now();
      persistCartItems(state.items);
    },
    updateQuantity(state, action: PayloadAction<{ cartKey: string; quantity: number }>) {
      const idx = state.items.findIndex((item) => item.cartKey === action.payload.cartKey);
      if (idx === -1) return;
      if (action.payload.quantity <= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items[idx].quantity = action.payload.quantity;
      }
      persistCartItems(state.items);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.cartKey !== action.payload);
      persistCartItems(state.items);
    },
    clearCart(state) {
      state.items = [];
      persistCartItems(state.items);
    },
    mergeGuestCart(state, action: PayloadAction<CartItem[]>) {
      for (const incomingItem of action.payload) {
        const existing = state.items.find((item) => item.cartKey === incomingItem.cartKey);
        if (existing) {
          existing.quantity += incomingItem.quantity;
        } else {
          state.items.push({ ...incomingItem });
        }
      }
      persistCartItems(state.items);
    },
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.isCartOpen = action.payload;
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  mergeGuestCart,
  setCartOpen,
} = cartSlice.actions;

export default cartSlice.reducer;
