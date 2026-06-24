/* ============================================
   GenAIL CRM — Lógica de Gestión de Clientes
   Archivo: /frontend/js/clientes.js
   Propósito: Listar, buscar, filtrar y cambiar de estado
              a clientes. Controlar paginación y modal.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Parámetros de paginación y filtros
  let currentPage = 1;
  const limit = 10;
  let searchTimeout = null;

  // Elementos del DOM
  const tableBody = document.getElementById('clientes-table-body');
  const searchInput = document.getElementById('search-input');
  const filterEstado = document.getElementById('filter-estado');
  const filterCategoria = document.getElementById('filter-categoria');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const paginationInfo = document.getElementById('pagination-info');

  // Modal
  const detailModal = document.getElementById('detail-modal');
  const modalClientName = document.getElementById('modal-client-name');
  const modalClientBody = document.getElementById('modal-client-body');

  // Cargar lista inicial
  cargarClientes();

  // --- Manejo de Eventos (Filtros y Búsqueda) ---
  
  // Búsqueda con debounce (esperar 400ms después de escribir para no saturar el servidor)
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      cargarClientes();
    }, 400);
  });

  filterEstado?.addEventListener('change', () => {
    currentPage = 1;
    cargarClientes();
  });

  filterCategoria?.addEventListener('change', () => {
    currentPage = 1;
    cargarClientes();
  });

  btnResetFilters?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (filterEstado) filterEstado.value = '';
    if (filterCategoria) filterCategoria.value = '';
    currentPage = 1;
    cargarClientes();
  });

  // --- Paginación ---
  btnPrevPage?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      cargarClientes();
    }
  });

  btnNextPage?.addEventListener('click', () => {
    currentPage++;
    cargarClientes();
  });

  // --- Cargar Clientes desde API ---
  async function cargarClientes() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            Cargando clientes...
          </td>
        </tr>
      `;

      const busqueda = searchInput?.value || '';
      const estado = filterEstado?.value || '';
      const categoria = filterCategoria?.value || '';

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        busqueda,
        estado,
        categoria
      });

      const res = await window.API.get(`/clientes?${queryParams.toString()}`);

      if (res.success && res.data) {
        const { clientes, total, page, pages } = res.data;
        renderTabla(clientes);
        actualizarPaginacion(total, page, pages);
      }
    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--danger-text); padding: var(--space-8);">
            ⚠️ Error al cargar clientes: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // --- Renderizar Tabla ---
  function renderTabla(clientes) {
    if (!clientes || clientes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            No se encontraron clientes que coincidan con los filtros.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';

    clientes.forEach(c => {
      const row = document.createElement('tr');

      // Nombre completo y Empresa
      const nombreCompleto = `${c.nombre} ${c.apellidos}`;
      const empresa = c.empresa || '<span class="text-tertiary" style="color: var(--text-tertiary); font-style: italic;">Particular</span>';

      // Contacto (Teléfono y correo)
      const contacto = `
        <div style="font-size: var(--font-size-xs);">
          ${c.correo ? `✉️ ${c.correo}` : ''}
          ${c.telefono ? `${c.correo ? '<br>' : ''}📞 ${c.telefono}` : ''}
        </div>
      `;

      // Badge de Categoría
      let badgeClass = 'badge-info';
      if (c.categoria === 'premium') badgeClass = 'badge-success';
      if (c.categoria === 'frecuente') badgeClass = 'badge-info';
      if (c.categoria === 'potencial') badgeClass = 'badge-warning';
      if (c.categoria === 'inactivo') badgeClass = 'badge-danger';

      const segmento = `<span class="badge ${badgeClass}">${c.categoria}</span>`;

      // Formatear fecha de última actividad
      const ultimaAct = c.ultimaActividad 
        ? new Date(c.ultimaActividad).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Sin actividad';

      // Badge de Estado
      const estadoBadge = c.estado === 'activo'
        ? `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">Activo</span>`
        : `<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">Inactivo</span>`;

      // Botón de activación/desactivación
      const btnToggleEstado = c.estado === 'activo'
        ? `<button class="btn btn-secondary btn-sm btn-toggle-estado" data-id="${c._id}" data-action="inactivo" title="Desactivar Cliente">🚫 Desactivar</button>`
        : `<button class="btn btn-success btn-sm btn-toggle-estado" data-id="${c._id}" data-action="activo" title="Activar Cliente">✅ Activar</button>`;

      row.innerHTML = `
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${nombreCompleto}</div>
          <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Reg: ${new Date(c.createdAt).toLocaleDateString()}</div>
        </td>
        <td>${empresa}</td>
        <td>${contacto}</td>
        <td>${segmento}</td>
        <td>${ultimaAct}</td>
        <td>${estadoBadge}</td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm btn-ver-detalle" data-id="${c._id}">👁️ Ver</button>
            <a href="cliente-form.html?id=${c._id}" class="btn btn-secondary btn-sm">✏️ Editar</a>
            ${btnToggleEstado}
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Asignar event listeners a botones dinámicos
    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        verDetalleCliente(id);
      });
    });

    document.querySelectorAll('.btn-toggle-estado').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        toggleEstadoCliente(id, action);
      });
    });
  }

  // --- Actualizar Controles de Paginación ---
  function actualizarPaginacion(total, page, pages) {
    currentPage = page;

    if (paginationInfo) {
      const from = total === 0 ? 0 : (page - 1) * limit + 1;
      const to = Math.min(page * limit, total);
      paginationInfo.textContent = `Mostrando ${from} a ${to} de ${total} clientes`;
    }

    if (btnPrevPage) btnPrevPage.disabled = page <= 1;
    if (btnNextPage) btnNextPage.disabled = page >= pages || pages === 0;
  }

  // --- Ver Detalle de Cliente ---
  async function verDetalleCliente(id) {
    try {
      const res = await window.API.get(`/clientes/${id}`);
      if (res.success && res.data.cliente) {
        const c = res.data.cliente;
        modalClientName.textContent = `${c.nombre} ${c.apellidos}`;

        let statusText = c.estado === 'activo' ? 'Activo' : 'Inactivo';
        let statusColor = c.estado === 'activo' ? 'var(--success-text)' : 'var(--danger-text)';

        modalClientBody.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Empresa</strong>
              <span>${c.empresa || 'Particular'}</span>
            </div>
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Estado</strong>
              <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
            </div>
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Correo</strong>
              <span>${c.correo || 'No especificado'}</span>
            </div>
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Teléfono</strong>
              <span>${c.telefono || 'No especificado'}</span>
            </div>
            <div style="grid-column: span 2;">
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Dirección</strong>
              <span>${c.direccion || 'No especificada'}</span>
            </div>
          </div>
          
          <div style="border-top: 1px solid var(--border-color); padding-top: var(--space-4); margin-top: var(--space-4); display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Segmentación</strong>
              <span class="badge badge-info" style="margin-top: 2px;">${c.categoria}</span>
            </div>
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Registrado Por</strong>
              <span>${c.registradoPor?.nombre || 'Administrador'}</span>
            </div>
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Total Compras</strong>
              <span style="color: var(--success-text); font-weight: 700;">Q${c.totalCompras.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <strong style="font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; text-transform: uppercase;">Cantidad Compras</strong>
              <span>${c.cantidadCompras} compra(s)</span>
            </div>
          </div>
        `;

        detailModal.classList.add('open');
      }
    } catch (err) {
      window.showToast('Error al obtener detalles del cliente', 'error');
    }
  }

  // --- Alternar Estado (Activar/Desactivar) ---
  async function toggleEstadoCliente(id, nuevoEstado) {
    try {
      const res = await window.API.patch(`/clientes/${id}/estado`, { estado: nuevoEstado });
      if (res.success) {
        window.showToast(res.message, 'success');
        cargarClientes();
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  }
});
