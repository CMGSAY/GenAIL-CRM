/* ============================================
   GenAIL CRM — Lógica de Gestión de Usuarios
   Archivo: /frontend/js/usuarios.js
   Propósito: Listar, registrar, editar y desactivar usuarios.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Restringir esta vista a administradores
  requireAdmin();

  // Elementos del DOM
  const tableBody = document.getElementById('usuarios-table-body');
  
  // Elementos Modal
  const usuarioModal = document.getElementById('usuario-modal');
  const modalTitle = document.getElementById('modal-usuario-title');
  const usuarioForm = document.getElementById('usuario-form');
  const usrIdInput = document.getElementById('usr-id');
  const usrNombre = document.getElementById('usr-nombre');
  const usrCorreo = document.getElementById('usr-correo');
  const usrPassword = document.getElementById('usr-password');
  const lblPassword = document.getElementById('lbl-password');
  const helpPassword = document.getElementById('help-password');
  const usrRol = document.getElementById('usr-rol');

  const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');

  // Inicializar
  cargarUsuarios();

  // --- Cargar Usuarios ---
  async function cargarUsuarios() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            Cargando usuarios...
          </td>
        </tr>
      `;

      const res = await window.API.get('/usuarios');

      if (res.success && res.data.usuarios) {
        renderTabla(res.data.usuarios);
      }
    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger-text); padding: var(--space-8);">
            ⚠️ Error al cargar usuarios: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // --- Render Tabla ---
  function renderTabla(usuarios) {
    if (!usuarios || usuarios.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            No hay usuarios registrados.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';

    usuarios.forEach(u => {
      const row = document.createElement('tr');

      // Nombre y avatar
      const avatarLetters = u.nombre.substring(0, 2).toUpperCase();
      const nombreCell = `
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="width: 32px; height: 32px; border-radius: var(--border-radius-full); background: rgba(99, 102, 241, 0.12); color: var(--primary-400); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-xs);">
            ${avatarLetters}
          </div>
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${u.nombre}</div>
            <div style="font-size: 10px; color: var(--text-tertiary);">Creado: ${new Date(u.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      `;

      // Rol Badge
      const rolBadge = u.rol === 'administrador'
        ? `<span class="badge badge-danger">administrador</span>`
        : `<span class="badge badge-info">empleado</span>`;

      // Último acceso
      const loginDate = u.ultimoAcceso
        ? new Date(u.ultimoAcceso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '<span style="color: var(--text-tertiary); font-style: italic;">Nunca</span>';

      // Estado Badge
      const estadoBadge = u.estado === 'activo'
        ? `<span class="badge badge-success">Activo</span>`
        : `<span class="badge badge-danger">Inactivo</span>`;

      // Botón Toggle Estado
      const btnToggle = u.estado === 'activo'
        ? `<button class="btn btn-secondary btn-sm btn-usr-toggle" data-id="${u._id}" data-action="inactivo">🚫 Desactivar</button>`
        : `<button class="btn btn-success btn-sm btn-usr-toggle" data-id="${u._id}" data-action="activo">✅ Activar</button>`;

      row.innerHTML = `
        <td>${nombreCell}</td>
        <td>${u.correo}</td>
        <td>${rolBadge}</td>
        <td>${loginDate}</td>
        <td>${estadoBadge}</td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm btn-usr-edit" data-id="${u._id}">✏️ Editar</button>
            ${btnToggle}
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Asignar listeners
    document.querySelectorAll('.btn-usr-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        abrirEditarUsuario(id);
      });
    });

    document.querySelectorAll('.btn-usr-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        toggleEstadoUsuario(id, action);
      });
    });
  }

  // --- Abrir Modal Nuevo Usuario ---
  btnNuevoUsuario?.addEventListener('click', () => {
    modalTitle.textContent = 'Agregar Usuario';
    usrIdInput.value = '';
    
    // Configurar contraseña como requerida
    lblPassword.textContent = 'Contraseña *';
    usrPassword.placeholder = '••••••••';
    usrPassword.required = true;
    helpPassword.textContent = 'Mínimo 6 caracteres.';

    // Resetear
    usrNombre.value = '';
    usrCorreo.value = '';
    usrPassword.value = '';
    usrRol.value = 'empleado';

    usuarioModal.classList.add('open');
  });

  // --- Abrir Modal Editar Usuario ---
  async function abrirEditarUsuario(id) {
    try {
      const res = await window.API.get(`/usuarios/${id}`);
      if (res.success && res.data.usuario) {
        const u = res.data.usuario;

        modalTitle.textContent = 'Editar Usuario';
        usrIdInput.value = u._id;
        
        // Contraseña es opcional al editar
        lblPassword.textContent = 'Contraseña (Opcional)';
        usrPassword.placeholder = 'Dejar en blanco para no cambiar';
        usrPassword.required = false;
        helpPassword.textContent = 'Llene este campo solo si desea cambiar la contraseña de acceso.';

        // Rellenar
        usrNombre.value = u.nombre;
        usrCorreo.value = u.correo;
        usrPassword.value = '';
        usrRol.value = u.rol;

        usuarioModal.classList.add('open');
      }
    } catch (err) {
      window.showToast('Error al cargar datos del usuario', 'error');
    }
  }

  // --- Guardar Usuario ---
  usuarioForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = usrIdInput.value;
    const nombre = usrNombre.value.trim();
    const correo = usrCorreo.value.trim();
    const contraseña = usrPassword.value;
    const rol = usrRol.value;

    const payload = { nombre, correo, rol };
    
    // Si hay contraseña o es creación, agregarla
    if (contraseña && contraseña.trim() !== '') {
      if (contraseña.length < 6) {
        window.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
      payload.contraseña = contraseña;
    }

    try {
      let res;
      if (id) {
        res = await window.API.put(`/usuarios/${id}`, payload);
      } else {
        res = await window.API.post('/usuarios', payload);
      }

      if (res.success) {
        window.showToast(id ? 'Usuario actualizado' : 'Usuario registrado', 'success');
        usuarioModal.classList.remove('open');
        cargarUsuarios();
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  // --- Cambiar Estado (Activar/Desactivar) ---
  async function toggleEstadoUsuario(id, nuevoEstado) {
    try {
      const res = await window.API.patch(`/usuarios/${id}/estado`, { estado: nuevoEstado });
      if (res.success) {
        window.showToast(res.message, 'success');
        cargarUsuarios();
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  }
});
