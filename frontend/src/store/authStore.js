import { create } from 'zustand';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (username, password) => {
    try {
      const response = await axios.post('/auth/login/', { username, password });
      const { access, user } = response.data;
      
      localStorage.setItem('token', access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      set({ user, token: access, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
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
    } catch (error) {
      get().logout();
    }
  }
}));