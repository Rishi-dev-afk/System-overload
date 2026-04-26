import { create } from 'zustand';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Restore token from localStorage on page load
const savedToken = localStorage.getItem('token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: savedToken,
  isAuthenticated: !!savedToken,

  login: async (username, password) => {
    try {
      // POST to /api/auth/login/ which returns { access, refresh }
      const response = await axios.post('/auth/login/', { username, password });
      const { access } = response.data;

      localStorage.setItem('token', access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // Fetch user profile
      const userResponse = await axios.get('/auth/user/');
      const user = userResponse.data;

      set({ user, token: access, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Login failed',
      };
    }
  },

  register: async (username, password, email) => {
    try {
      // Registration via Django admin or a custom endpoint; we do a best-effort call
      await axios.post('/auth/register/', { username, password, email });
      return await get().login(username, password);
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/auth/user/');
      set({ user: response.data, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },
}));
