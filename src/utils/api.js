// YeneRent/src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.cache = new Map(); // Simple in-memory cache
  }

  // Simple cache key generator
  getCacheKey(endpoint, options) {
    return `${options.method || 'GET'}_${endpoint}`;
  }

  // Check if we should use cache
  shouldUseCache(endpoint, options) {
    return (options.method || 'GET') === 'GET' && !endpoint.includes('?'); // Only cache simple GET requests
  }

  // Get cached data if available and not expired
  getCached(endpoint, options) {
    if (!this.shouldUseCache(endpoint, options)) return null;
    const key = this.getCacheKey(endpoint, options);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached.data;
    }
    return null;
  }

  // Set cache
  setCache(endpoint, options, data) {
    if (!this.shouldUseCache(endpoint, options)) return;
    const key = this.getCacheKey(endpoint, options);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Sleep function for retry delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: {
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // Don't set Content-Type for FormData, let browser set it
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests
    if (this.shouldUseCache(endpoint, options)) {
      const cached = this.getCached(endpoint, options);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 304) {
        // Not Modified - return null or cached data if available
        return null;
      }

      if (response.status === 429 && retryCount < 3) {
        // Rate limited - retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.warn(`Rate limited (429), retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.request(endpoint, options, retryCount + 1);
      }

      if (!response.ok) {
        // Check if it's a network error that should be retried
        if ((response.status >= 500 || response.status === 408) && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.warn(`Server error (${response.status}), retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.request(endpoint, options, retryCount + 1);
        }

        const errorData = await response.json().catch(() => ({}));
        // Handle validation errors which return { errors: [...] }
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessage = errorData.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessage);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      this.setCache(endpoint, options, data);

      return data;
    } catch (error) {
      // Retry on network errors
      if ((error.name === 'TypeError' || error.message.includes('fetch')) && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`Network error, retrying in ${delay}ms...`, error.message);
        await this.sleep(delay);
        return this.request(endpoint, options, retryCount + 1);
      }

      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

const api = {
  // Properties
  async getProperties() {
    return apiClient.get('/properties');
  },

  async createProperty(data) {
    return apiClient.post('/properties', data);
  },

  async updateProperty(id, data) {
    return apiClient.put(`/properties/${id}`, data);
  },

  async deleteProperty(id) {
    return apiClient.delete(`/properties/${id}`);
  },

  // Units
  async getUnits() {
    return apiClient.get('/units');
  },

  async createUnit(data) {
    return apiClient.post('/units', data);
  },

  async updateUnit(id, data) {
    return apiClient.put(`/units/${id}`, data);
  },

  async deleteUnit(id) {
    return apiClient.delete(`/units/${id}`);
  },

  // Tenants
  async getTenants() {
    return apiClient.get('/tenants');
  },

  async createTenant(data) {
    return apiClient.post('/tenants', data);
  },

  async updateTenant(id, data) {
    return apiClient.put(`/tenants/${id}`, data);
  },

  async deleteTenant(id) {
    return apiClient.delete(`/tenants/${id}`);
  },

  // Leases
  async getLeases() {
    return apiClient.get('/leases');
  },

  async createLease(data) {
    return apiClient.post('/leases', data);
  },

  async updateLease(id, data) {
    return apiClient.put(`/leases/${id}`, data);
  },

  async deleteLease(id) {
    return apiClient.delete(`/leases/${id}`);
  },

  // Payments
  async getPayments() {
    return apiClient.get('/payments');
  },

  async createPayment(data) {
    return apiClient.post('/payments', data);
  },

  async updatePayment(id, data) {
    return apiClient.put(`/payments/${id}`, data);
  },

  async deletePayment(id) {
    return apiClient.delete(`/payments/${id}`);
  },

  // Expenses
  async getExpenses() {
    return apiClient.get('/expenses');
  },

  async createExpense(data) {
    return apiClient.post('/expenses', data);
  },

  async updateExpense(id, data) {
    return apiClient.put(`/expenses/${id}`, data);
  },

  async deleteExpense(id) {
    return apiClient.delete(`/expenses/${id}`);
  },

  // Documents
  async getDocuments() {
    return apiClient.get('/documents');
  },

  async createDocument(data) {
    return apiClient.post('/documents', data);
  },

  async updateDocument(id, data) {
    return apiClient.put(`/documents/${id}`, data);
  },

  async deleteDocument(id) {
    return apiClient.delete(`/documents/${id}`);
  },

  // Maintenance
  async getMaintenance() {
    return apiClient.get('/maintenance');
  },

  async createMaintenance(data) {
    return apiClient.post('/maintenance', data);
  },

  async updateMaintenance(id, data) {
    return apiClient.put(`/maintenance/${id}`, data);
  },

  async deleteMaintenance(id) {
    return apiClient.delete(`/maintenance/${id}`);
  },

  // Utilities
  async getUtilities() {
    return apiClient.get('/utilities');
  },

  async createUtility(data) {
    return apiClient.post('/utilities', data);
  },

  async updateUtility(id, data) {
    return apiClient.put(`/utilities/${id}`, data);
  },

  async deleteUtility(id) {
    return apiClient.delete(`/utilities/${id}`);
  },

  // Analytics
  async getAnalytics() {
    return apiClient.get('/analytics');
  },

  // Auth
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  async getProfile() {
    return apiClient.get('/auth/me');
  },

  async updateProfile(data) {
    return apiClient.put('/auth/me', data);
  },

  async getSubscription() {
    return apiClient.get('/subscriptions/current');
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(data) {
    return apiClient.post('/auth/reset-password', data);
  },

  // Generic methods for backward compatibility
  async get(resource) {
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    const methodName = `get${singular.charAt(0).toUpperCase() + singular.slice(1)}`;
    if (typeof this[methodName] === 'function') {
      return this[methodName]();
    }
    return apiClient.get(resource.startsWith('/') ? resource : `/${resource}`);
  },

  async create(resource, data) {
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    const methodName = `create${singular.charAt(0).toUpperCase() + singular.slice(1)}`;
    return this[methodName](data);
  },

  async update(resource, id, data) {
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    const methodName = `update${singular.charAt(0).toUpperCase() + singular.slice(1)}`;
    return this[methodName](id, data);
  },

  async delete(resource, id) {
    if (!id) {
      return apiClient.delete(resource.startsWith('/') ? resource : `/${resource}`);
    }
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    const methodName = `delete${singular.charAt(0).toUpperCase() + singular.slice(1)}`;
    if (typeof this[methodName] === 'function') {
      return this[methodName](id);
    }
    return apiClient.delete(`/${resource}/${id}`);
  },

  async post(endpoint, data) {
    return apiClient.post(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, data);
  },

  async put(endpoint, data) {
    return apiClient.put(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, data);
  },

  // Logout helper
  logout() {
    localStorage.removeItem('token');
  }
};

// Named exports for individual functions
export const seedData = api.seedData;
export const get = api.get.bind(api);
export const create = api.create.bind(api);
export const update = api.update.bind(api);
export const remove = api.delete.bind(api); // Alias for delete

// Helper to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const serverUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
