// YeneRent/src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
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
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(data) {
    return apiClient.post('/auth/reset-password', data);
  },

  // Generic methods for backward compatibility
  async get(resource) {
    return this[`get${resource.charAt(0).toUpperCase() + resource.slice(1)}`]();
  },

  async create(resource, data) {
    return this[`create${resource.charAt(0).toUpperCase() + resource.slice(1)}`](data);
  },

  async update(resource, id, data) {
    return this[`update${resource.charAt(0).toUpperCase() + resource.slice(1)}`](id, data);
  },

  async delete(resource, id) {
    return this[`delete${resource.charAt(0).toUpperCase() + resource.slice(1)}`](id);
  },

  // Logout helper
  logout() {
    localStorage.removeItem('token');
  }
};

// Named exports for individual functions
export const seedData = api.seedData;
export const get = api.get;
export const create = api.create;
export const update = api.update;
export const remove = api.delete; // Alias for delete

export default api;
