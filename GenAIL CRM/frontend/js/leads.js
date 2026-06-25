/* ============================================
   GenAIL CRM — Lógica de Gestión de Leads
   Archivo: /frontend/js/leads.js
   Propósito: Listar leads, filtrar por estados/interés,
              cambiar de etapa e ingresar oportunidades.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const tableBody = document.getElementById('leads-table-body');
  const filterEstado = document.getElementById('filter-lead-estado');
  const filterInteres = document.getElementById('filter-lead-interes');
  const sortLead = document.getElementById('sort-lead');
  const btnResetFilters = document.getElementById('btn-reset-lead-filters');
  const pipelineValueText = document.getElementById('lead-pipeline-value');

  // Elementos Modal
  const leadModal = document.getElementById('lead-modal');
  const modalLeadTitle = document.getElementById('modal-lead-title');
  const leadForm = document.getElementById('lead-form');
  const leadIdInput = document.getElementById('lead-id');
  const leadSelectCliente = document.getElementById('lead-select-cliente');
  const selectClienteGroup = document.getElementById('select-cliente-group');
  const leadProducto = document.getElementById('lead-producto');
  const leadNivelInteres = document.getElementById('lead-nivel-interes');
  const leadValor = document.getElementById('lead-valor');
  const leadAsignado = document.getElementById('lead-asignado');
  const assigneeRow = document.getElementById('assignee-row');
  const leadNotas = document.getElementById('lead-notas');

  const btnNuevoLead = document.getElementById('btn-nuevo-lead');

  // Variables de sesión
  const token = localStorage.getItem('genail_token');
  let usuarioRol = 'empleado';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      usuarioRol = payload.rol || 'empleado';
    } catch (e) {
      console.error(e);
    }
  }

  // Inicializar vistas
  cargarSelectorClientes();
  if (usuarioRol === 'administrador') {
    cargarSelectorUsuarios();
    assigneeRow.style.display = 'block';
  }
  cargarLeads();

  // --- Filtros ---
  filterEstado?.addEventListener('change', cargarLeads);
  filterInteres?.addEventListener('change', cargarLeads);
  sortLead?.addEventListener('change', cargarLeads);
  
  btnResetFilters?.addEventListener('click', () => {
    if (filterEstado) filterEstado.value = '';
    if (filterInteres) filterInteres.value = '';
    if (sortLead) sortLead.value = '';
    cargarLeads();
  });

  // --- Cargar Selector Clientes ---
  async function cargarSelectorClientes() {
    try {
      const res = await window.API.get('/clientes?limit=200&estado=activo');
      if (res.success && res.data.clientes) {
        leadSelectCliente.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
        res.data.clientes.forEach(c => {
          const option = document.createElement('option');
          option.value = c._id;
          option.textContent = `${c.nombre} ${c.apellidos} (${c.empresa || 'Particular'})`;
          leadSelectCliente.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Error al cargar selector de clientes:', err);
    }
  }

  // --- Cargar Selector Usuarios (Solo Admin) ---
  async function cargarSelectorUsuarios() {
    try {
      // Endpoint /api/usuarios que se implementará en sprint 10
      // Usaremos try-catch silencioso para evitar romper en sprints tempranos
      const res = await window.API.get('/usuarios?estado=activo');
      if (res.success && res.data.usuarios) {
        leadAsignado.innerHTML = '';
        res.data.usuarios.forEach(u => {
          const option = document.createElement('option');
          option.value = u._id;
          option.textContent = `${u.nombre} (${u.rol})`;
          leadAsignado.appendChild(option);
        });
      }
    } catch (err) {
      // Fallback a sí mismo
      leadAsignado.innerHTML = '<option value="">Asignar al creador</option>';
    }
  }

  // --- Cargar Leads ---
  async function cargarLeads() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            Cargando oportunidades...
          </td>
        </tr>
      `;

      const estado = filterEstado?.value || '';
      const nivelInteres = filterInteres?.value || '';
      const ordenar = sortLead?.value || '';

      const queryParams = new URLSearchParams();
      if (estado) queryParams.append('estado', estado);
      if (nivelInteres) queryParams.append('nivelInteres', nivelInteres);
      if (ordenar) queryParams.append('ordenar', ordenar);

      const res = await window.API.get(`/leads?${queryParams.toString()}`);

      if (res.success && res.data.leads) {
        renderTabla(res.data.leads);
        calcularPipelineValue(res.data.leads);
      }
    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--danger-text); padding: var(--space-8);">
            ⚠️ Error al cargar oportunidades: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // --- Renderizar Tabla ---
  function renderTabla(leads) {
    if (!leads || leads.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            No se encontraron oportunidades registradas en esta categoría.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';

    leads.forEach(l => {
      const row = document.createElement('tr');

      const gastoAcumulado = l.clienteId && l.clienteId.totalCompras !== undefined
        ? `<br><span style="font-size: var(--font-size-xs); color: var(--success-text); font-weight: 600;">Gasto: Q${l.clienteId.totalCompras.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>`
        : '';

      const cliente = l.clienteId
        ? `${l.clienteId.nombre} ${l.clienteId.apellidos}<br><span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${l.clienteId.empresa || 'Particular'}</span>${gastoAcumulado}`
        : '<span style="color: var(--text-tertiary); font-style: italic;">Sin cliente</span>';

      const valor = `Q${l.valorEstimado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

      // Nivel de interés badge
      let badgeInteresClass = 'badge-info';
      if (l.nivelInteres === 'alto') badgeInteresClass = 'badge-danger';
      if (l.nivelInteres === 'medio') badgeInteresClass = 'badge-warning';
      if (l.nivelInteres === 'bajo') badgeInteresClass = 'badge-info';
      const interesBadge = `<span class="badge ${badgeInteresClass}">${l.nivelInteres}</span>`;

      // Selector de estado interactivo (inline)
      const options = [
        { value: 'nuevo', text: 'Nuevo' },
        { value: 'contactado', text: 'Contactado' },
        { value: 'en_negociacion', text: 'En Negociación' },
        { value: 'ganado', text: 'Ganado' },
        { value: 'perdido', text: 'Perdido' }
      ];

      let selectOptions = '';
      options.forEach(opt => {
        const selected = opt.value === l.estado ? 'selected' : '';
        selectOptions += `<option value="${opt.value}" ${selected}>${opt.text}</option>`;
      });

      let badgeEstadoClass = 'badge-info';
      if (l.estado === 'nuevo') badgeEstadoClass = 'badge-info';
      if (l.estado === 'contactado') badgeEstadoClass = 'badge-info';
      if (l.estado === 'en_negociacion') badgeEstadoClass = 'badge-warning';
      if (l.estado === 'ganado') badgeEstadoClass = 'badge-success';
      if (l.estado === 'perdido') badgeEstadoClass = 'badge-danger';

      const inlineSelect = `
        <select class="form-control inline-stage-select ${badgeEstadoClass}" data-id="${l._id}" style="width: 150px; padding: 2px 8px; height: auto; font-size: var(--font-size-xs); font-weight: 600;">
          ${selectOptions}
        </select>
      `;

      const asignado = l.asignadoA?.nombre || 'Sin asignar';

      row.innerHTML = `
        <td>${cliente}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${l.productoInteres}</div>
          <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Registrado: ${new Date(l.createdAt).toLocaleDateString()}</div>
        </td>
        <td style="font-weight: 700; color: var(--text-primary);">${valor}</td>
        <td>${interesBadge}</td>
        <td>${inlineSelect}</td>
        <td>${asignado}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm btn-edit-lead" data-id="${l._id}">✏️ Editar</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Event listeners inline select de estado
    document.querySelectorAll('.inline-stage-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const nuevoEstado = e.target.value;
        await cambiarEstadoLead(id, nuevoEstado);
      });
    });

    // Event listeners editar lead
    document.querySelectorAll('.btn-edit-lead').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        abrirEditarLead(id);
      });
    });
  }

  // --- Calcular Valor en Pipeline ---
  function calcularPipelineValue(leads) {
    // Sumamos solo las negociaciones que no han fracasado ("nuevo", "contactado", "en_negociacion", "ganado")
    const suma = leads
      .filter(l => l.estado !== 'perdido')
      .reduce((acc, l) => acc + l.valorEstimado, 0);

    pipelineValueText.textContent = `Monto Estimado en Pipeline: Q${suma.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }

  // --- Cambiar Estado del Lead via PATCH ---
  async function cambiarEstadoLead(id, nuevoEstado) {
    try {
      const res = await window.API.patch(`/leads/${id}/estado`, { estado: nuevoEstado });
      if (res.success) {
        window.showToast(res.message, 'success');
        cargarLeads();
      }
    } catch (err) {
      window.showToast(err.message, 'error');
      cargarLeads(); // Revertir cambios en UI
    }
  }

  // --- Abrir Modal para Nuevo Lead ---
  btnNuevoLead?.addEventListener('click', () => {
    modalLeadTitle.textContent = 'Registrar Oportunidad';
    leadIdInput.value = '';
    selectClienteGroup.style.display = 'block';
    
    // Resetear formulario
    leadSelectCliente.setAttribute('required', 'required');
    leadSelectCliente.value = '';
    leadProducto.value = '';
    leadNivelInteres.value = 'medio';
    leadValor.value = '0.00';
    leadNotas.value = '';

    leadModal.classList.add('open');
  });

  // --- Abrir Modal para Editar Lead ---
  async function abrirEditarLead(id) {
    try {
      const res = await window.API.get(`/leads/${id}`);
      if (res.success && res.data.lead) {
        const l = res.data.lead;

        modalLeadTitle.textContent = 'Editar Oportunidad';
        leadIdInput.value = l._id;
        
        // Al editar no dejamos cambiar de cliente para preservar integridad
        selectClienteGroup.style.display = 'none';
        leadSelectCliente.removeAttribute('required');
        if (l.clienteId) {
          leadSelectCliente.value = l.clienteId._id || l.clienteId;
        }

        leadProducto.value = l.productoInteres;
        leadNivelInteres.value = l.nivelInteres;
        leadValor.value = l.valorEstimado;
        leadNotas.value = l.notas || '';

        if (usuarioRol === 'administrador' && l.asignadoA) {
          leadAsignado.value = l.asignadoA._id;
        }

        leadModal.classList.add('open');
      }
    } catch (err) {
      window.showToast('Error al cargar datos de la oportunidad', 'error');
    }
  }

  // --- Guardar Lead ---
  leadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = leadIdInput.value;
    const clienteId = leadSelectCliente.value;
    const productoInteres = leadProducto.value.trim();
    const nivelInteres = leadNivelInteres.value;
    const valorEstimado = parseFloat(leadValor.value) || 0;
    const notas = leadNotas.value.trim();
    const asignadoA = leadAsignado?.value || undefined;

    const payload = {
      productoInteres,
      nivelInteres,
      valorEstimado,
      notas
    };

    if (usuarioRol === 'administrador' && asignadoA) {
      payload.asignadoA = asignadoA;
    }

    try {
      let res;
      if (id) {
        // Editar
        res = await window.API.put(`/leads/${id}`, payload);
      } else {
        // Crear
        if (!clienteId) {
          window.showToast('Debe especificar un cliente', 'error');
          return;
        }
        payload.clienteId = clienteId;
        res = await window.API.post('/leads', payload);
      }

      if (res.success) {
        window.showToast(id ? 'Oportunidad actualizada' : 'Oportunidad registrada', 'success');
        leadModal.classList.remove('open');
        cargarLeads();
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
});
