import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, UserRole } from '../../types/eyewear';

interface AuthState {
  user: UserProfile | null;
  authReady: boolean;
  loginModalOpen: boolean;
  loginModalReason: 'DEFAULT' | 'AI_TRYON';
  tryOnModalOpen: boolean;
  tryOnProductSlug: string | null;
}

const initialState: AuthState = {
  user: null,
  authReady: false,
  loginModalOpen: false,
  loginModalReason: 'DEFAULT',
  tryOnModalOpen: false,
  tryOnProductSlug: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
      state.authReady = true;
    },
    setAuthReady(state, action: PayloadAction<boolean>) {
      state.authReady = action.payload;
    },
    setActiveRolePreview(state, action: PayloadAction<UserRole>) {
      if (state.user) {
        state.user.role = action.payload;
      }
    },
    openLoginModal(state, action: PayloadAction<'DEFAULT' | 'AI_TRYON' | undefined>) {
      state.loginModalOpen = true;
      state.loginModalReason = action.payload ?? 'DEFAULT';
    },
    closeLoginModal(state) {
      state.loginModalOpen = false;
      state.loginModalReason = 'DEFAULT';
    },
    openTryOnModal(state, action: PayloadAction<string | null | undefined>) {
      if (!state.user) {
        state.loginModalOpen = true;
        state.loginModalReason = 'AI_TRYON';
        return;
      }
      state.tryOnModalOpen = true;
      state.tryOnProductSlug = action.payload ?? null;
    },
    closeTryOnModal(state) {
      state.tryOnModalOpen = false;
    },
  },
});

export const {
  setUser,
  setAuthReady,
  setActiveRolePreview,
  openLoginModal,
  closeLoginModal,
  openTryOnModal,
  closeTryOnModal,
} = authSlice.actions;

export default authSlice.reducer;
