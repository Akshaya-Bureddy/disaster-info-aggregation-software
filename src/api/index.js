import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  validateStatus: status => status >= 200 && status < 500
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.',
        isNetworkError: true
      });
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData);
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Profile update failed. Please try again.');
  }
};

// Disaster endpoints
export const createDisaster = async (formData) => {
  try {
    const processedFormData = new FormData();
    
    for (let [key, value] of formData.entries()) {
      if (key !== 'images' && key !== 'videos') {
        processedFormData.append(key, value);
      }
    }

    const images = formData.getAll('images');
    if (images.length > 0) {
      images.forEach(image => {
        if (image instanceof File) {
          processedFormData.append('images', image);
        }
      });
    }

    const videos = formData.getAll('videos');
    if (videos.length > 0) {
      videos.forEach(video => {
        if (video instanceof File) {
          processedFormData.append('videos', video);
        }
      });
    }

    const response = await api.post('/disasters', processedFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 60000
    });

    if (!response.data) {
      throw new Error('Server returned empty response');
    }

    return response;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to create disaster report. Please try again.'
    );
  }
};

export const getDisasters = async (params = {}) => {
  try {
    const response = await api.get('/disasters', { params });
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch disasters. Please try again.');
  }
};

export const getReportedDisasters = async (params = {}) => {
  try {
    const response = await api.get('/disasters/reported', { 
      params: {
        type: params.type || '',
        severity: params.severity || '',
        startDate: params.startDate || '',
        endDate: params.endDate || '',
        location: params.location || '',
        sort: params.sort || '-timestamp',
        page: params.page || 1,
        limit: params.limit || 10
      }
    });
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch reported disasters. Please try again.');
  }
};

export const getNearbyDisasters = async (params) => {
  try {
    const response = await api.get('/disasters/nearby', { params });
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch nearby disasters. Please try again.');
  }
};

export const updateDisasterStatus = async (id, status) => {
  try {
    const response = await api.put(`/disasters/${id}`, { status });
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to update disaster status. Please try again.');
  }
};

export const getDisasterById = async (id) => {
  try {
    const response = await api.get(`/disasters/${id}`);
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch disaster details. Please try again.');
  }
};

export const getDisastersByType = async (type) => {
  try {
    const response = await api.get(`/disasters/type/${type}`);
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch disasters by type. Please try again.');
  }
};
export const getLocalDisasters = async (coordinates) => {
  try {
    const response = await api.get('/disasters/local', {
      params: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: 50 // radius in kilometers
      }
    });
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch local disasters.');
  }
};

export const getDisasterStats = async () => {
  try {
    const response = await api.get('/externaldatas');
    return response;
  } catch (error) {
    if (error.isNetworkError) throw error;
    throw new Error(error.response?.data?.message || 'Failed to fetch disaster statistics. Please try again.');
  }
};

// Utility functions
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const logout = () => {
  localStorage.removeItem('authToken');
};

export const updateAlertSettings = async (settings) => {
  const response = await axios.put('/api/disasters/settings/alerts', settings);
  return response.data;
};

export default api;