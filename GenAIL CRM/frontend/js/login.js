/* ============================================
   GenAIL CRM — Lógica de Login
   Archivo: /frontend/js/login.js
   Propósito: Manejar envíos de formularios, alternancia
              de vistas y bootstrap del sistema.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const loginForm = document.getElementById('login-form');
  const recoveryForm = document.getElementById('recovery-form');
  const bootstrapForm = document.getElementById('bootstrap-form');
  const resetPasswordForm = document.getElementById('reset-password-form');
  const bootstrapSection = document.getElementById('bootstrap-section');

  const toggleRecovery = document.getElementById('toggle-recovery');
  const toggleLogin = document.getElementById('toggle-login');
  const btnShowBootstrap = document.getElementById('btn-show-bootstrap');
  const cancelBootstrap = document.getElementById('cancel-bootstrap');

  // Verificar si hay un token de reset en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset');

  if (resetToken) {
    // Si hay token de reset, mostrar directamente ese formulario
    showForm(resetPasswordForm);
  } else {
    // Verificar si el sistema ya está inicializado (si existe algún usuario)
    verificarInicializacion();
  }

  // --- Alternancia de Vistas ---
  toggleRecovery?.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(recoveryForm);
  });

  toggleLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(loginForm);
  });

  btnShowBootstrap?.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(bootstrapForm);
  });

  cancelBootstrap?.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(loginForm);
  });

  // --- Envío de Formulario: Login ---
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('login-correo').value;
    const contraseña = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${window.CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contraseña })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error al iniciar sesión');
      }

      // Guardar token JWT y datos de sesión
      localStorage.setItem('genail_token', result.data.token);

      showToast('¡Inicio de sesión exitoso!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Envío de Formulario: Recuperación ---
  recoveryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('recovery-correo').value;

    try {
      const res = await fetch(`${window.CONFIG.API_BASE_URL}/auth/recuperar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error en la recuperación');
      }

      showToast('Instrucciones enviadas (Consulte consola del servidor)', 'success');
      
      // Si estamos en desarrollo, imprimir en consola del frontend el enlace simulado para facilitar pruebas
      if (result.data && result.data.enlaceReset) {
        console.log('🔗 [DEV] Enlace de recuperación:', result.data.enlaceReset);
        showToast('Enlace impreso en consola del navegador/servidor', 'info');
      }

      setTimeout(() => {
        showForm(loginForm);
      }, 2500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Envío de Formulario: Restablecer Contraseña ---
  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevaContraseña = document.getElementById('reset-password-input').value;

    try {
      const res = await fetch(`${window.CONFIG.API_BASE_URL}/auth/reset/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaContraseña })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error al restablecer la contraseña');
      }

      showToast('¡Contraseña restablecida exitosamente!', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Envío de Formulario: Bootstrap Inicial ---
  bootstrapForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('boot-name').value;
    const correo = document.getElementById('boot-correo').value;
    const contraseña = document.getElementById('boot-password').value;

    try {
      const res = await fetch(`${window.CONFIG.API_BASE_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, contraseña, rol: 'administrador' })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error al registrar administrador');
      }

      showToast('¡Administrador creado con éxito! Inicie sesión.', 'success');
      
      // Ocultar sección bootstrap permanentemente
      bootstrapSection.style.display = 'none';

      setTimeout(() => {
        showForm(loginForm);
      }, 1500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Helper para alternar formularios
  function showForm(formToShow) {
    loginForm.style.display = 'none';
    recoveryForm.style.display = 'none';
    bootstrapForm.style.display = 'none';
    resetPasswordForm.style.display = 'none';

    formToShow.style.display = 'block';
  }

  // Verifica si el sistema necesita bootstrap
  async function verificarInicializacion() {
    try {
      const res = await fetch(`${window.CONFIG.API_BASE_URL}/auth/inicializado`);
      if (res.ok) {
        const result = await res.json();
        if (result.data && !result.data.inicializado) {
          bootstrapSection.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Error verificando inicialización del servidor:', err);
    }
  }
});
