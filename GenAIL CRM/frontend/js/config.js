/* ============================================
   GenAIL CRM — Configuración Global de Frontend
   Archivo: /frontend/js/config.js
   Propósito: Definición de variables globales,
              API base URL y configuración.
   ============================================ */

const CONFIG = {
  // Al servir el frontend desde el mismo servidor Express,
  // la API se consume de forma relativa a la raíz.
  API_BASE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`
};

window.CONFIG = CONFIG;
