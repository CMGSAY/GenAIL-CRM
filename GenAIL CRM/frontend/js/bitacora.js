/* ============================================
   GenAIL CRM — Lógica de Bitácora de Actividades
   Archivo: /frontend/js/bitacora.js
   Propósito: Cargar listado paginado y filtrado de auditoría.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Restringir esta vista a administradores
  requireAdmin();

  // Parámetros de paginación
  let currentPage = 1;
  const limit = 20;
  let searchTimeout = null;

  // Elementos del DOM
  const tableBody = document.getElementById('bitacora-table-body');
  const searchUsuario = document.getElementById('search-usuario');
  const filterModulo = document.getElementById('filter-modulo');
  const btnReset = document.getElementById('btn-reset-bitacora');
  
  const btnPrev = document.getElementById('btn-bitacora-prev');
  const btnNext = document.getElementById('btn-bitacora-next');
  const paginationInfo = document.getElementById('bitacora-pagination-info');

  // Cargar registros iniciales
  cargarBitacora();

  // --- Filtros ---
  searchUsuario?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      cargarBitacora();
    }, 400);
  });

  filterModulo?.addEventListener('change', () => {
    currentPage = 1;
    cargarBitacora();
  });

  btnReset?.addEventListener('click', () => {
    if (searchUsuario) searchUsuario.value = '';
    if (filterModulo) filterModulo.value = '';
    currentPage = 1;
    cargarBitacora();
  });

  // --- Paginación ---
  btnPrev?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      cargarBitacora();
    }
  });

  btnNext?.addEventListener('click', () => {
    currentPage++;
    cargarBitacora();
  });

  // --- Cargar Bitácora ---
  async function cargarBitacora() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            Cargando registros de auditoría...
          </td>
        </tr>
      `;

      const usuario = searchUsuario?.value || '';
      const modulo = filterModulo?.value || '';

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        usuario,
        modulo
      });

      const res = await window.API.get(`/bitacora?${queryParams.toString()}`);

      if (res.success && res.data) {
        const { registros, total, page, pages } = res.data;
        renderTabla(registros);
        actualizarPaginacion(total, page, pages);
      }
    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger-text); padding: var(--space-8);">
            ⚠️ Error al cargar la bitácora: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // --- Render Tabla ---
  function renderTabla(registros) {
    if (!registros || registros.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            No se encontraron registros de auditoría con los filtros actuales.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';

    registros.forEach(r => {
      const row = document.createElement('tr');

      const fechaText = new Date(r.fecha).toLocaleDateString();
      const timestamp = `${fechaText}<br><span style="font-size: 10px; color: var(--text-tertiary);">${r.hora}</span>`;
      
      const usuario = `<div style="font-weight: 600; color: var(--text-primary);">${r.nombreUsuario}</div>`;

      // Badge de módulo
      let badgeClass = 'badge-info';
      if (r.modulo === 'autenticacion') badgeClass = 'badge-info';
      if (r.modulo === 'clientes') badgeClass = 'badge-info';
      if (r.modulo === 'compras') badgeClass = 'badge-success';
      if (r.modulo === 'leads') badgeClass = 'badge-warning';
      if (r.modulo === 'seguimientos') badgeClass = 'badge-warning';
      if (r.modulo === 'usuarios') badgeClass = 'badge-danger';
      
      const moduloBadge = `<span class="badge ${badgeClass}">${r.modulo}</span>`;
      const ip = r.ip || '127.0.0.1';

      row.innerHTML = `
        <td>${timestamp}</td>
        <td>${usuario}</td>
        <td><strong style="color: var(--text-primary);">${r.accion}</strong></td>
        <td>${moduloBadge}</td>
        <td style="max-width: 320px; word-wrap: break-word;">${r.descripcion}</td>
        <td style="font-family: monospace; font-size: var(--font-size-xs);">${ip}</td>
      `;

      tableBody.appendChild(row);
    });
  }

  // --- Paginación ---
  function actualizarPaginacion(total, page, pages) {
    currentPage = page;

    if (paginationInfo) {
      const from = total === 0 ? 0 : (page - 1) * limit + 1;
      const to = Math.min(page * limit, total);
      paginationInfo.textContent = `Mostrando ${from} a ${to} de ${total} registros`;
    }

    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= pages || pages === 0;
  }
});
