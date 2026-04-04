import { createSlice } from '@reduxjs/toolkit';

const getBootAuthState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) {
    return { user: null, token: null, isAuthenticated: false };
  }
  try {
    return {
      user: JSON.parse(userStr),
      token,
      isAuthenticated: true,
    };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { user: null, token: null, isAuthenticated: false };
  }
};

const initialState = {
  ...getBootAuthState(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    restoreAuth: (state) => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          state.token = token;
          state.user = JSON.parse(userStr);
          state.isAuthenticated = true;
        } catch {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, restoreAuth, logout } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
