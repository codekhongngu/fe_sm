import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/AuthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
