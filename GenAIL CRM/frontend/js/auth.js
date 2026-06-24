/* ============================================
   GenAIL CRM — Control de Autenticación Frontend
   Archivo: /frontend/js/auth.js
   Propósito: Controlar accesos, validar tokens JWT
              y redirigir según el rol del usuario.
   ============================================ */

/**
 * Verifica si existe un token JWT válido y redirige si no es así.
 */
function checkAuth() {
  const token = localStorage.getItem('genail_token');
  const isLoginPage = window.location.pathname.includes('login.html');

  if (!token) {
    if (!isLoginPage) {
      window.location.href = 'login.html';
    }
    return null;
  }

  // Validar expiración del token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      console.warn('El token de sesión ha expirado');
      localStorage.removeItem('genail_token');
      if (!isLoginPage) {
        window.location.href = 'login.html';
      }
      return null;
    }

    // Si ya está logueado e intenta ir a login, redirigir a dashboard
    if (isLoginPage) {
      window.location.href = 'dashboard.html';
    }

    return payload;
  } catch (error) {
    console.error('Error procesando el token JWT:', error);
    localStorage.removeItem('genail_token');
    if (!isLoginPage) {
      window.location.href = 'login.html';
    }
    return null;
  }
}

/**
 * Verifica si el usuario logueado es Administrador. Redirige a dashboard si no lo es.
 */
function requireAdmin() {
  const payload = checkAuth();
  if (payload && payload.rol !== 'administrador') {
    window.location.href = 'dashboard.html';
  }
}

// Ejecutar validación de autenticación inmediatamente
checkAuth();
