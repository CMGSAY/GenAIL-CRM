/* ============================================
   GenAIL CRM — Lógica de Seguimiento Comercial
   Archivo: /frontend/js/seguimientos.js
   Propósito: Cargar listado de pendientes, timeline
              por cliente e insertar interacciones.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const segSelectCliente = document.getElementById('seg-select-cliente');
  const selectClienteHistorial = document.getElementById('select-cliente-historial');
  const pendientesContainer = document.getElementById('pendientes-container');
  const historialInteraccionesContainer = document.getElementById('historial-interacciones-container');

  // Elementos Formulario Modal
  const seguimientoModal = document.getElementById('seguimiento-modal');
  const seguimientoForm = document.getElementById('seguimiento-form');
  const segTipo = document.getElementById('seg-tipo');
  const segFecha = document.getElementById('seg-fecha');
  const segDesc = document.getElementById('seg-desc');
  const segProxima = document.getElementById('seg-proxima');
  const segFechaProxima = document.getElementById('seg-fecha-proxima');

  const btnNuevoSeguimiento = document.getElementById('btn-nuevo-seguimiento');

  // Inicializar cargando clientes y pendientes
  cargarSelectorClientes();
  cargarPendientes();

  // --- Cargar Selector Clientes ---
  async function cargarSelectorClientes() {
    try {
      const res = await window.API.get('/clientes?limit=200&estado=activo');
      if (res.success && res.data.clientes) {
        segSelectCliente.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
        selectClienteHistorial.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
        
        res.data.clientes.forEach(c => {
          const option = document.createElement('option');
          option.value = c._id;
          option.textContent = `${c.nombre} ${c.apellidos} (${c.empresa || 'Particular'})`;
          
          segSelectCliente.appendChild(option.cloneNode(true));
          selectClienteHistorial.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Error al cargar selector de clientes:', err);
    }
  }

  // --- Cambiar Cliente en Historial Timeline ---
  selectClienteHistorial?.addEventListener('change', (e) => {
    const clienteId = e.target.value;
    if (!clienteId) {
      historialInteraccionesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-tertiary); padding: var(--space-6);">
          Seleccione un cliente para cargar su historial de interacciones.
        </div>
      `;
      return;
    }
    cargarHistorialTimeline(clienteId);
  });

  // --- Cargar Pendientes (Recordatorios) ---
  async function cargarPendientes() {
    try {
      pendientesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-tertiary); padding: var(--space-6);">
          Cargando pendientes...
        </div>
      `;

      const res = await window.API.get('/seguimientos/pendientes');

      if (res.success && res.data.pendientes) {
        renderPendientes(res.data.pendientes);
      }
    } catch (err) {
      pendientesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--danger-text); padding: var(--space-6);">
          ⚠️ Error al cargar pendientes: ${err.message}
        </div>
      `;
    }
  }

  // --- Renderizar Pendientes ---
  function renderPendientes(pendientes) {
    if (!pendientes || pendientes.length === 0) {
      pendientesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-tertiary); padding: var(--space-6); border-style: dashed;">
          🎉 ¡Excelente! No tienes acciones de seguimiento pendientes para hoy.
        </div>
      `;
      return;
    }

    pendientesContainer.innerHTML = '';

    pendientes.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card card-hover';
      card.style.padding = 'var(--space-4)';
      card.style.marginBottom = 'var(--space-2)';

      const clienteNombre = p.clienteId 
        ? `${p.clienteId.nombre} ${p.clienteId.apellidos}` 
        : 'Cliente Desconocido';
      
      const empresa = p.clienteId?.empresa || 'Particular';

      // Calcular urgencia de fecha límite
      const fechaLim = new Date(p.fechaProxima);
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      fechaLim.setHours(0,0,0,0);
      
      const diff = fechaLim - hoy;
      const diffDias = Math.ceil(diff / (1000 * 60 * 60 * 24));

      let fechaText = fechaLim.toLocaleDateString();
      let alertClass = 'badge-info';
      if (diffDias < 0) {
        fechaText += ` (Vencido hace ${Math.abs(diffDias)} días)`;
        alertClass = 'badge-danger';
      } else if (diffDias === 0) {
        fechaText += ' (¡Hoy!)';
        alertClass = 'badge-warning';
      } else {
        fechaText += ` (En ${diffDias} días)`;
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3);">
          <div>
            <div style="font-weight: 700; color: var(--text-primary);">${clienteNombre}</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-2);">${empresa}</div>
            
            <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-3);">
              🎯 <strong>Acción programada:</strong> ${p.proximaAccion || 'Seguimiento general'}
            </div>
            
            <span class="badge ${alertClass}">Límite: ${fechaText}</span>
          </div>
          <div>
            <button class="btn btn-success btn-sm btn-completar-accion" data-id="${p._id}" style="white-space: nowrap;">
              ✓ Completar
            </button>
          </div>
        </div>
      `;

      pendientesContainer.appendChild(card);
    });

    // Bindeo de completar
    document.querySelectorAll('.btn-completar-accion').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await completarRecordatorio(id);
      });
    });
  }

  // --- Completar recordatorio via PATCH ---
  async function completarRecordatorio(id) {
    try {
      const res = await window.API.patch(`/seguimientos/${id}/completar`);
      if (res.success) {
        window.showToast('Recordatorio completado con éxito', 'success');
        cargarPendientes();
        
        // Recargar timeline si el cliente seleccionado coincide
        const clienteSeleccionado = selectClienteHistorial.value;
        if (clienteSeleccionado) {
          cargarHistorialTimeline(clienteSeleccionado);
        }
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  }

  // --- Cargar Timeline de un Cliente ---
  async function cargarHistorialTimeline(clienteId) {
    try {
      historialInteraccionesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-tertiary); padding: var(--space-6);">
          Cargando interacciones...
        </div>
      `;

      const res = await window.API.get(`/seguimientos/cliente/${clienteId}`);

      if (res.success && res.data.seguimientos) {
        renderTimeline(res.data.seguimientos);
      }
    } catch (err) {
      historialInteraccionesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--danger-text); padding: var(--space-6);">
          ⚠️ Error al cargar historial: ${err.message}
        </div>
      `;
    }
  }

  // --- Renderizar Timeline ---
  function renderTimeline(seguimientos) {
    if (!seguimientos || seguimientos.length === 0) {
      historialInteraccionesContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-tertiary); padding: var(--space-6); border-style: dashed;">
          Ningún contacto registrado con este cliente.
        </div>
      `;
      return;
    }

    historialInteraccionesContainer.innerHTML = '';

    seguimientos.forEach(s => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = 'var(--space-4)';
      card.style.position = 'relative';

      // Emoji e interacción
      let emoji = '📞';
      if (s.tipo === 'correo') emoji = '✉️';
      if (s.tipo === 'mensaje') emoji = '💬';
      if (s.tipo === 'reunion') emoji = '🤝';
      if (s.tipo === 'visita') emoji = '🏢';
      if (s.tipo === 'otro') emoji = '📌';

      const fechaFormateada = new Date(s.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const atendio = s.realizadoPor?.nombre || 'Representante';

      // Info próxima acción si está agendada
      let proximaAccionHtml = '';
      if (s.proximaAccion && s.fechaProxima) {
        const completadaText = s.completado
          ? '<span style="color: var(--success-text); font-weight:600;">(✓ Completada)</span>'
          : '<span style="color: var(--warning-text); font-weight:600;">(Pendiente)</span>';

        proximaAccionHtml = `
          <div style="margin-top: var(--space-3); padding-top: var(--space-2); border-top: 1px dashed var(--border-color); font-size: var(--font-size-xs);">
            📅 <strong>Próxima acción:</strong> ${s.proximaAccion} - Límite: ${new Date(s.fechaProxima).toLocaleDateString()} ${completadaText}
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display: flex; gap: var(--space-3);">
          <div style="font-size: var(--font-size-2xl); width: 40px; height: 40px; background: var(--bg-primary); border-radius: var(--border-radius-sm); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); flex-shrink: 0;">
            ${emoji}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-weight: 700; color: var(--text-primary); text-transform: capitalize;">${s.tipo}</span>
              <span style="font-size: 10px; color: var(--text-tertiary);">${fechaFormateada}</span>
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-2);">Registrado por: ${atendio}</div>
            <p style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5;">${s.descripcion}</p>
            ${proximaAccionHtml}
          </div>
        </div>
      `;

      historialInteraccionesContainer.appendChild(card);
    });
  }

  // --- Abrir Modal Nueva Interacción ---
  btnNuevoSeguimiento?.addEventListener('click', () => {
    // Resetear formulario
    seguimientoForm.reset();
    
    // Setear fecha por defecto a 'ahora'
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    segFecha.value = ahora.toISOString().slice(0, 16);

    // Si ya hay un cliente seleccionado en el timeline, setearlo
    const clienteSeleccionado = selectClienteHistorial.value;
    if (clienteSeleccionado) {
      segSelectCliente.value = clienteSeleccionado;
    }

    seguimientoModal.classList.add('open');
  });

  // --- Guardar Seguimiento ---
  seguimientoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clienteId = segSelectCliente.value;
    const tipo = segTipo.value;
    const fecha = segFecha.value;
    const descripcion = segDesc.value.trim();
    const proximaAccion = segProxima.value.trim();
    const fechaProxima = segFechaProxima.value;

    if (!clienteId || !tipo || !descripcion) {
      window.showToast('Complete todos los campos obligatorios (*)', 'error');
      return;
    }

    const payload = {
      clienteId,
      tipo,
      descripcion,
      fecha
    };

    if (proximaAccion && fechaProxima) {
      payload.proximaAccion = proximaAccion;
      payload.fechaProxima = fechaProxima;
    }

    try {
      const res = await window.API.post('/seguimientos', payload);

      if (res.success) {
        window.showToast('Actividad registrada correctamente', 'success');
        seguimientoModal.classList.remove('open');
        
        // Recargar listados
        cargarPendientes();

        // Si el cliente del timeline coincide, recargar timeline
        const clienteSeleccionado = selectClienteHistorial.value;
        if (clienteSeleccionado && clienteSeleccionado === clienteId) {
          cargarHistorialTimeline(clienteId);
        }
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
});
