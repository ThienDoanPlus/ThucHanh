import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../types/eyewear';

interface NotificationState {
  items: AppNotification[];
  isPanelOpen: boolean;
}

const initialState: NotificationState = {
  items: [],
  isPanelOpen: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<AppNotification[]>) {
      state.items = action.payload;
    },
    pushNotification(state, action: PayloadAction<AppNotification>) {
      state.items.unshift(action.payload);
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const target = state.items.find((n) => n.id === action.payload);
      if (target) target.isRead = true;
    },
    setNotificationPanelOpen(state, action: PayloadAction<boolean>) {
      state.isPanelOpen = action.payload;
    },
  },
});

export const {
  setNotifications,
  pushNotification,
  markNotificationRead,
  setNotificationPanelOpen,
} = notificationSlice.actions;

export default notificationSlice.reducer;
