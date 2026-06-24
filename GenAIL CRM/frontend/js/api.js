/* ============================================
   GenAIL CRM — Wrapper de API Fetch
   Archivo: /frontend/js/api.js
   Propósito: Centralizar llamadas HTTP al backend,
              inyectar JWT token y manejar errores comunes.
   ============================================ */

const API = {
  /**
   * Petición genérica
   */
  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem('genail_token');
    
    // Configurar headers por defecto
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        // Si la sesión expiró o es inválida en backend (401)
        if (response.status === 401) {
          localStorage.removeItem('genail_token');
          window.location.href = 'login.html';
        }
        throw new Error(result.message || 'Error en la petición');
      }

      return result;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  get: (endpoint, options = {}) => API.request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => API.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => API.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options = {}) => API.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => API.request(endpoint, { ...options, method: 'DELETE' })
};

window.API = API;
