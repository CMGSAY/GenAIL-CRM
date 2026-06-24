/* ============================================
   GenAIL CRM — Componentes Reutilizables JS
   Archivo: /frontend/js/components.js
   Propósito: Generar e inyectar dinámicamente el
              sidebar, header y footer en las páginas.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar layout
  injectLayout();
  // Verificar notificaciones iniciales si el usuario está autenticado
  if (localStorage.getItem('genail_token')) {
    updateNotificationCount();
  }
});

/**
 * Inyecta el HTML del sidebar, header y footer si los contenedores correspondientes existen.
 */
function injectLayout() {
  const sidebarContainer = document.getElementById('sidebar-container');
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');

  // Obtener información del usuario autenticado
  const token = localStorage.getItem('genail_token');
  let usuario = { nombre: 'Invitado', rol: 'empleado' };
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      usuario.nombre = payload.nombre || 'Usuario';
      usuario.rol = payload.rol || 'empleado';
    } catch (e) {
      console.error('Error al decodificar token:', e);
    }
  }

  // Determinar página activa para iluminar el link correcto
  const currentPath = window.location.pathname;
  const isActive = (page) => currentPath.includes(page) ? 'active' : '';

  // 1. Sidebar HTML
  if (sidebarContainer) {
    const isAdmin = usuario.rol === 'administrador';
    
    sidebarContainer.innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">G</div>
          <span class="brand-text">GenAIL <span>CRM</span></span>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section">
            <div class="nav-section-title">Principal</div>
            <a href="dashboard.html" class="nav-item ${isActive('dashboard')}">
              <span class="nav-icon">📊</span>
              <span>Dashboard</span>
            </a>
            <a href="clientes.html" class="nav-item ${isActive('cliente')}">
              <span class="nav-icon">👤</span>
              <span>Clientes</span>
            </a>
            <a href="historial.html" class="nav-item ${isActive('historial')}">
              <span class="nav-icon">🛍️</span>
              <span>Historial Comercial</span>
            </a>
          </div>

          <div class="nav-section">
            <div class="nav-section-title">Ventas</div>
            <a href="leads.html" class="nav-item ${isActive('lead')}">
              <span class="nav-icon">🎯</span>
              <span>Clientes Potenciales</span>
            </a>
            <a href="seguimientos.html" class="nav-item ${isActive('seguimiento')}">
              <span class="nav-icon">📞</span>
              <span>Seguimientos</span>
            </a>
          </div>

          ${isAdmin ? `
          <div class="nav-section">
            <div class="nav-section-title">Administración</div>
            <a href="usuarios.html" class="nav-item ${isActive('usuarios')}">
              <span class="nav-icon">👥</span>
              <span>Usuarios</span>
            </a>
            <a href="bitacora.html" class="nav-item ${isActive('bitacora')}">
              <span class="nav-icon">📜</span>
              <span>Bitácora</span>
            </a>
          </div>
          ` : ''}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user" id="user-menu-btn">
            <div class="user-avatar">${usuario.nombre.substring(0, 2).toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${usuario.nombre}</div>
              <div class="user-role">${usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}</div>
            </div>
          </div>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
  }

  // 2. Header HTML
  if (headerContainer) {
    const pageTitle = getPageTitleByPath(currentPath);
    headerContainer.innerHTML = `
      <header class="header">
        <div class="header-left">
          <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menú">☰</button>
          <div>
            <div class="page-title">${pageTitle.title}</div>
            <div class="page-subtitle">${pageTitle.subtitle}</div>
          </div>
        </div>
        <div class="header-right">
          <button class="header-btn" id="notif-btn" title="Notificaciones">
            🔔
            <span class="badge-count" id="notif-badge-count" style="display: none;">0</span>
          </button>
          <button class="header-btn" id="logout-btn" title="Cerrar sesión">
            🚪
          </button>

          <!-- Panel flotante de notificaciones -->
          <div class="notif-panel" id="notif-panel">
            <div class="notif-panel-header">
              <span class="notif-panel-title">Alertas Comerciales</span>
              <button class="btn btn-secondary btn-sm" id="btn-read-all-notifs" style="padding: 2px 8px; font-size: 9px;">✓ Leer todas</button>
            </div>
            <div class="notif-panel-body" id="notif-panel-body">
              <div style="text-align: center; color: var(--text-tertiary); padding: var(--space-6); font-size: var(--font-size-xs);">Cargando...</div>
            </div>
          </div>
        </div>
      </header>
    `;

    // Asignar listeners de header
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Toggle notificaciones
    const notifBtn = document.getElementById('notif-btn');
    const notifPanel = document.getElementById('notif-panel');
    const btnReadAll = document.getElementById('btn-read-all-notifs');

    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel?.classList.toggle('open');
      if (notifPanel?.classList.contains('open')) {
        cargarNotificacionesTray();
      }
    });

    btnReadAll?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await marcarTodasNotifLeidas();
    });

    // Cerrar panel al hacer click fuera
    document.addEventListener('click', (e) => {
      if (notifPanel && !notifPanel.contains(e.target) && e.target !== notifBtn) {
        notifPanel.classList.remove('open');
      }
    });
    
    // Toggle menú móvil
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar && overlay) {
      const toggleMenu = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      };

      menuToggle.addEventListener('click', toggleMenu);
      overlay.addEventListener('click', toggleMenu);
    }
  }

  // 3. Footer HTML
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer style="text-align: center; padding: var(--space-6); color: var(--text-tertiary); font-size: var(--font-size-xs); border-top: 1px solid var(--border-color); margin-top: var(--space-12);">
        &copy; ${new Date().getFullYear()} GenAIL CRM. Todos los derechos reservados.
      </footer>
    `;
  }
}

/**
 * Devuelve el título y subtítulo de la página basado en el path.
 */
function getPageTitleByPath(path) {
  if (path.includes('dashboard')) {
    return { title: 'Dashboard Ejecutivo', subtitle: 'Resumen y estadísticas del negocio' };
  } else if (path.includes('cliente-form')) {
    return { title: 'Formulario de Cliente', subtitle: 'Registrar o editar información de cliente' };
  } else if (path.includes('clientes')) {
    return { title: 'Gestión de Clientes', subtitle: 'Listado completo, filtrado y registro' };
  } else if (path.includes('historial')) {
    return { title: 'Historial Comercial', subtitle: 'Historial de compras y productos' };
  } else if (path.includes('leads')) {
    return { title: 'Clientes Potenciales (Leads)', subtitle: 'Pipeline de oportunidades de venta' };
  } else if (path.includes('seguimiento')) {
    return { title: 'Seguimiento Comercial', subtitle: 'Llamadas, visitas y recordatorios' };
  } else if (path.includes('usuarios')) {
    return { title: 'Gestión de Usuarios', subtitle: 'Control de accesos y roles del sistema' };
  } else if (path.includes('bitacora')) {
    return { title: 'Bitácora de Actividades', subtitle: 'Historial de acciones auditadas' };
  }
  return { title: 'GenAIL CRM', subtitle: 'Sistema de Gestión de Clientes' };
}

/**
 * Realiza el cierre de sesión eliminando el token y redirigiendo al login.
 */
function handleLogout() {
  localStorage.removeItem('genail_token');
  showToast('Sesión cerrada correctamente', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

/**
 * Obtiene el conteo de notificaciones no leídas del backend.
 */
async function updateNotificationCount() {
  try {
    const token = localStorage.getItem('genail_token');
    if (!token) return;

    // fetch a endpoint /api/notificaciones/count (que se implementará en sprint 9)
    // Para no romper en fases previas, manejamos errores con gracia
    const res = await fetch('/api/notificaciones/count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const result = await res.json();
      const count = result.data?.count || 0;
      const badge = document.getElementById('notif-badge-count');
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (e) {
    // Silencioso antes de que el endpoint esté activo
  }
}

/**
 * Muestra una alerta flotante (Toast)
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Remover después de 3.5 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// Hacer showToast global para que otras páginas lo usen
window.showToast = showToast;

/**
 * Carga y renderiza la lista de notificaciones en el tray
 */
async function cargarNotificacionesTray() {
  const body = document.getElementById('notif-panel-body');
  if (!body) return;

  try {
    body.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: var(--space-6); font-size: var(--font-size-xs);">Cargando...</div>';
    
    const token = localStorage.getItem('genail_token');
    const res = await fetch('/api/notificaciones', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar alertas');
    const result = await res.json();
    const list = result.data?.notificaciones || [];

    if (list.length === 0) {
      body.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: var(--space-6); font-size: var(--font-size-xs);">No tienes notificaciones en este momento.</div>';
      return;
    }

    body.innerHTML = '';
    list.forEach(n => {
      const item = document.createElement('div');
      item.className = `notif-item ${n.leida ? '' : 'unread'}`;
      
      let badgeIcon = '🔔';
      if (n.tipo === 'seguimiento_pendiente') badgeIcon = '📞';
      if (n.tipo === 'cliente_sin_contacto') badgeIcon = '👤';
      if (n.tipo === 'oportunidad_por_vencer') badgeIcon = '🎯';

      const dateText = new Date(n.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      item.innerHTML = `
        <div style="display: flex; gap: var(--space-2);">
          <span>${badgeIcon}</span>
          <div style="flex: 1;">
            <div class="notif-item-text">${n.mensaje}</div>
            <div class="notif-item-date">${dateText}</div>
          </div>
        </div>
      `;

      item.addEventListener('click', async () => {
        if (!n.leida) {
          await marcarNotifLeida(n._id);
        }
        // Opcional: Redirigir según el tipo de referencia si aplica
        if (n.referenciaTipo === 'Seguimiento') window.location.href = 'seguimientos.html';
        if (n.referenciaTipo === 'Lead') window.location.href = 'leads.html';
        if (n.referenciaTipo === 'Cliente') window.location.href = 'clientes.html';
      });

      body.appendChild(item);
    });

  } catch (err) {
    body.innerHTML = `<div style="text-align: center; color: var(--danger-text); padding: var(--space-6); font-size: var(--font-size-xs);">⚠️ Error: ${err.message}</div>`;
  }
}

/**
 * Marca una notificación individual como leída
 */
async function marcarNotifLeida(id) {
  try {
    const token = localStorage.getItem('genail_token');
    const res = await fetch(`/api/notificaciones/${id}/leer`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      updateNotificationCount();
      cargarNotificacionesTray();
    }
  } catch (e) {
    console.error('Error al marcar notificación:', e);
  }
}

/**
 * Marca todas las notificaciones como leídas
 */
async function marcarTodasNotifLeidas() {
  try {
    const token = localStorage.getItem('genail_token');
    const res = await fetch('/api/notificaciones/leer-todas', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Todas las alertas leídas', 'success');
      updateNotificationCount();
      cargarNotificacionesTray();
    }
  } catch (e) {
    console.error('Error al marcar todas las notificaciones:', e);
  }
}
