/* ============================================
   GenAIL CRM — Lógica de Historial Comercial
   Archivo: /frontend/js/historial.js
   Propósito: Cargar selector de clientes, listar
              historial, registrar compra interactiva.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const selectCliente = document.getElementById('select-cliente');
  const btnNuevaCompra = document.getElementById('btn-nueva-compra');
  const clienteResumenCard = document.getElementById('cliente-resumen-card');
  const comprasSeccion = document.getElementById('compras-seccion');
  const comprasTableBody = document.getElementById('compras-table-body');

  // Elementos Resumen
  const resumenTotal = document.getElementById('resumen-total');
  const resumenCantidad = document.getElementById('resumen-cantidad');
  const resumenCategoria = document.getElementById('resumen-categoria');
  const resumenFrecuencia = document.getElementById('resumen-frecuencia');

  // Elementos Modal Compra
  const compraModal = document.getElementById('compra-modal');
  const modalClienteNombre = document.getElementById('modal-cliente-nombre');
  const compraClienteId = document.getElementById('compra-cliente-id');
  const productosListContainer = document.getElementById('productos-list-container');
  const btnAddItem = document.getElementById('btn-add-item');
  const compraTotalCalc = document.getElementById('compra-total-calc');
  const compraForm = document.getElementById('compra-form');
  const compraObs = document.getElementById('compra-obs');

  // Elementos Modal Detalle Compra
  const compraDetalleModal = document.getElementById('compra-detalle-modal');
  const modalDetalleBody = document.getElementById('modal-detalle-body');

  // Variables de Estado
  let clientesMap = {}; // Mapa rápido para consultar datos de clientes localmente
  let allClientes = []; // Guardar lista original de todos los clientes activos

  // Inicializar cargando clientes
  cargarSelectorClientes();

  // --- Cargar Selector de Clientes ---
  async function cargarSelectorClientes() {
    try {
      const res = await window.API.get('/clientes?limit=100&estado=activo');
      if (res.success && res.data.clientes) {
        allClientes = res.data.clientes;
        allClientes.forEach(c => {
          clientesMap[c._id] = c;
        });
        // Rellenar el selector original oculto para mantener compatibilidad total
        if (selectCliente) {
          selectCliente.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
          allClientes.forEach(c => {
            const option = document.createElement('option');
            option.value = c._id;
            option.textContent = `${c.nombre} ${c.apellidos}`;
            selectCliente.appendChild(option);
          });
        }
      }
    } catch (err) {
      window.showToast('Error al cargar la lista de clientes', 'error');
    }
  }

  // --- Buscador y Sugerencias de Autocompletado ---
  const buscarClienteInput = document.getElementById('buscar-cliente-input');
  const suggestionsContainer = document.getElementById('autocomplete-suggestions');

  buscarClienteInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      ocultarSugerencias();
      return;
    }

    const filtered = allClientes.filter(c => {
      const nombreCompleto = `${c.nombre} ${c.apellidos}`.toLowerCase();
      const correo = (c.correo || '').toLowerCase();
      const empresa = (c.empresa || '').toLowerCase();
      return nombreCompleto.includes(query) || correo.includes(query) || empresa.includes(query);
    });

    renderSugerencias(filtered);
  });

  function renderSugerencias(lista) {
    if (!suggestionsContainer) return;
    
    if (lista.length === 0) {
      suggestionsContainer.innerHTML = '<div style="padding: var(--space-3) var(--space-4); color: var(--text-tertiary); font-size: var(--font-size-xs);">No se encontraron clientes</div>';
      suggestionsContainer.style.display = 'block';
      return;
    }

    suggestionsContainer.innerHTML = '';
    lista.forEach(c => {
      const item = document.createElement('div');
      item.className = 'autocomplete-suggestion-item';
      
      const empresaText = c.empresa ? ` · ${c.empresa}` : '';
      const correoText = c.correo ? ` · ${c.correo}` : '';

      item.innerHTML = `
        <div class="autocomplete-suggestion-name">${c.nombre} ${c.apellidos}</div>
        <div class="autocomplete-suggestion-meta">Particular${empresaText}${correoText}</div>
      `;

      item.addEventListener('click', () => {
        // Al seleccionar un cliente de la sugerencia:
        buscarClienteInput.value = `${c.nombre} ${c.apellidos} (${c.empresa || 'Particular'})`;
        ocultarSugerencias();

        // Actualizar el selector original oculto y disparar evento de cambio
        if (selectCliente) {
          selectCliente.value = c._id;
          selectCliente.dispatchEvent(new Event('change'));
        }
      });

      suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.style.display = 'block';
  }

  function ocultarSugerencias() {
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (suggestionsContainer && !suggestionsContainer.contains(e.target) && e.target !== buscarClienteInput) {
      ocultarSugerencias();
    }
  });

  // Si el usuario vacía el input de búsqueda, resetear la vista y la selección
  buscarClienteInput?.addEventListener('input', (e) => {
    if (!e.target.value.trim()) {
      if (selectCliente) {
        selectCliente.value = '';
        selectCliente.dispatchEvent(new Event('change'));
      }
    }
  });

  // --- Cambio de Cliente Seleccionado ---
  selectCliente?.addEventListener('change', async (e) => {
    const clienteId = e.target.value;

    if (!clienteId) {
      btnNuevaCompra.disabled = true;
      clienteResumenCard.style.display = 'none';
      comprasSeccion.style.display = 'none';
      return;
    }

    btnNuevaCompra.disabled = false;
    await actualizarFichaCliente(clienteId);
    await cargarHistorialCompras(clienteId);
  });

  // --- Actualizar Resumen Superior del Cliente ---
  async function actualizarFichaCliente(clienteId) {
    try {
      const res = await window.API.get(`/clientes/${clienteId}`);
      if (res.success && res.data.cliente) {
        const c = res.data.cliente;
        // Guardar de nuevo en el mapa local
        clientesMap[clienteId] = c;

        // Mostrar sección resumen
        resumenTotal.textContent = `Q${c.totalCompras.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
        resumenCantidad.textContent = `${c.cantidadCompras} compra(s)`;
        
        // Categoria badge
        resumenCategoria.textContent = c.categoria;
        resumenCategoria.className = 'badge'; // Reset
        let badgeClass = 'badge-info';
        if (c.categoria === 'premium') badgeClass = 'badge-success';
        if (c.categoria === 'frecuente') badgeClass = 'badge-info';
        if (c.categoria === 'potencial') badgeClass = 'badge-warning';
        if (c.categoria === 'inactivo') badgeClass = 'badge-danger';
        resumenCategoria.classList.add(badgeClass);

        clienteResumenCard.style.display = 'block';
      }
    } catch (err) {
      console.error('Error actualizando ficha de cliente:', err);
    }
  }

  // --- Cargar Historial Comercial (Tabla) ---
  async function cargarHistorialCompras(clienteId) {
    try {
      comprasTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            Cargando historial...
          </td>
        </tr>
      `;
      comprasSeccion.style.display = 'block';

      const res = await window.API.get(`/compras/cliente/${clienteId}`);

      if (res.success && res.data.compras) {
        renderTablaCompras(res.data.compras);
        calcularFrecuencia(res.data.compras);
      }
    } catch (err) {
      comprasTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger-text); padding: var(--space-8);">
            ⚠️ Error al cargar historial: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // --- Renderizar Compras ---
  function renderTablaCompras(compras) {
    if (!compras || compras.length === 0) {
      comprasTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: var(--space-8);">
            Este cliente aún no registra transacciones comerciales.
          </td>
        </tr>
      `;
      return;
    }

    comprasTableBody.innerHTML = '';

    compras.forEach(compra => {
      const row = document.createElement('tr');

      const fechaFormateada = new Date(compra.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Rascado de productos
      const itemNombres = compra.productos.map(p => `${p.nombre} (${p.cantidad})`).join(', ');
      const descCorta = itemNombres.length > 50 ? itemNombres.substring(0, 47) + '...' : itemNombres;

      const monto = `Q${compra.montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
      const atendio = compra.registradoPor?.nombre || 'Desconocido';
      const observaciones = compra.observaciones || '<span class="text-tertiary" style="color: var(--text-tertiary); font-style: italic;">Ninguna</span>';

      row.innerHTML = `
        <td>${fechaFormateada}</td>
        <td title="${itemNombres}">${descCorta}</td>
        <td style="font-weight: 700; color: var(--success-text);">${monto}</td>
        <td>${atendio}</td>
        <td>${observaciones}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm btn-detalle-compra" data-id="${compra._id}">👁️ Detalles</button>
        </td>
      `;

      comprasTableBody.appendChild(row);
    });

    // Event listener para el botón ver detalle compra
    document.querySelectorAll('.btn-detalle-compra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        verDetalleCompra(id);
      });
    });
  }

  // --- Calcular Frecuencia ---
  function calcularFrecuencia(compras) {
    if (!compras || compras.length < 2) {
      resumenFrecuencia.textContent = 'Requiere al menos 2 compras';
      return;
    }

    // Ordenar fechas para calcular deltas
    const fechas = compras.map(c => new Date(c.fecha)).sort((a, b) => a - b);
    let totalDiferenciaDias = 0;

    for (let i = 1; i < fechas.length; i++) {
      const diff = Math.abs(fechas[i] - fechas[i - 1]);
      totalDiferenciaDias += diff / (1000 * 60 * 60 * 24);
    }

    const promedio = Math.ceil(totalDiferenciaDias / (fechas.length - 1));
    resumenFrecuencia.textContent = `Cada ${promedio} días aprox.`;
  }

  // --- Abrir Modal Nueva Compra ---
  btnNuevaCompra?.addEventListener('click', () => {
    const clienteId = selectCliente.value;
    const c = clientesMap[clienteId];
    if (!c) return;

    modalClienteNombre.textContent = `${c.nombre} ${c.apellidos}`;
    compraClienteId.value = clienteId;
    
    // Inicializar modal con 1 item vacío
    productosListContainer.innerHTML = '';
    compraObs.value = '';
    compraTotalCalc.textContent = 'Q0.00';
    agregarFilaProducto();

    compraModal.classList.add('open');
  });

  // Agregar fila de producto en el modal
  btnAddItem?.addEventListener('click', () => {
    agregarFilaProducto();
  });

  function agregarFilaProducto() {
    const rowId = 'prod-row-' + Date.now();
    const div = document.createElement('div');
    div.className = 'form-row prod-item-row';
    div.id = rowId;
    div.style.marginBottom = 'var(--space-2)';
    div.style.alignItems = 'flex-end';

    div.innerHTML = `
      <div style="flex: 2; min-width: 150px; margin-bottom: 0;" class="form-group">
        <label class="form-label" style="font-size: 10px;">Nombre Producto</label>
        <input type="text" class="form-control prod-nombre" placeholder="Servicio de Consultoría" required>
      </div>
      <div style="flex: 1; min-width: 70px; margin-bottom: 0;" class="form-group">
        <label class="form-label" style="font-size: 10px;">Cantidad</label>
        <input type="number" class="form-control prod-cantidad" min="1" value="1" required>
      </div>
      <div style="flex: 1; min-width: 90px; margin-bottom: 0;" class="form-group">
        <label class="form-label" style="font-size: 10px;">Precio (Q)</label>
        <input type="number" class="form-control prod-precio" min="0" step="0.01" placeholder="100.00" required>
      </div>
      <div style="margin-bottom: 0;">
        <button type="button" class="btn btn-danger btn-sm btn-remove-item" style="height: 38px;">🗑️</button>
      </div>
    `;

    productosListContainer.appendChild(div);

    // Bindeo de cálculos en tiempo real
    div.querySelector('.prod-cantidad').addEventListener('input', calcularTotalCompra);
    div.querySelector('.prod-precio').addEventListener('input', calcularTotalCompra);

    // Botón eliminar fila
    div.querySelector('.btn-remove-item').addEventListener('click', () => {
      // Dejar al menos un item
      if (document.querySelectorAll('.prod-item-row').length > 1) {
        div.remove();
        calcularTotalCompra();
      } else {
        window.showToast('Debe registrar al menos un producto', 'error');
      }
    });

    calcularTotalCompra();
  }

  // --- Calcular Total Compra en tiempo real ---
  function calcularTotalCompra() {
    let total = 0;
    document.querySelectorAll('.prod-item-row').forEach(row => {
      const cantidad = parseInt(row.querySelector('.prod-cantidad').value) || 0;
      const precio = parseFloat(row.querySelector('.prod-precio').value) || 0;
      total += cantidad * precio;
    });

    compraTotalCalc.textContent = `Q${total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }

  // --- Guardar Compra ---
  compraForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clienteId = compraClienteId.value;
    const observaciones = compraObs.value.trim();

    // Rascado de productos desde la UI
    const productos = [];
    let valid = true;

    document.querySelectorAll('.prod-item-row').forEach(row => {
      const nombre = row.querySelector('.prod-nombre').value.trim();
      const cantidad = parseInt(row.querySelector('.prod-cantidad').value);
      const precioUnitario = parseFloat(row.querySelector('.prod-precio').value);

      if (!nombre || isNaN(cantidad) || cantidad < 1 || isNaN(precioUnitario) || precioUnitario < 0) {
        valid = false;
        return;
      }

      productos.push({ nombre, cantidad, precioUnitario });
    });

    if (!valid || productos.length === 0) {
      window.showToast('Verifique los datos de los productos. Cantidad debe ser >= 1 y Precio >= Q0.00', 'error');
      return;
    }

    try {
      const payload = {
        clienteId,
        productos,
        observaciones
      };

      const res = await window.API.post('/compras', payload);

      if (res.success) {
        window.showToast('Compra registrada exitosamente', 'success');
        compraModal.classList.remove('open');
        
        // Recargar ficha cliente e historial
        await actualizarFichaCliente(clienteId);
        await cargarHistorialCompras(clienteId);
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  // --- Ver Detalles Completos de una Compra ---
  async function verDetalleCompra(id) {
    try {
      const res = await window.API.get(`/compras/${id}`);
      if (res.success && res.data.compra) {
        const c = res.data.compra;
        const fecha = new Date(c.fecha).toLocaleString();

        let itemsHtml = '';
        c.productos.forEach(p => {
          itemsHtml += `
            <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: var(--space-1); border-bottom: 1px dashed var(--border-color); padding-bottom: 2px;">
              <span>${p.nombre} (x${p.cantidad})</span>
              <span style="font-weight: 600;">Q${p.subtotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
          `;
        });

        modalDetalleBody.innerHTML = `
          <div style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-3);">
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); text-transform: uppercase;">Cliente</div>
            <div style="font-weight: 700; color: var(--text-primary);">${c.clienteId.nombre} ${c.clienteId.apellidos}</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${c.clienteId.empresa || 'Particular'}</div>
          </div>

          <div style="margin-bottom: var(--space-4);">
            <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2);">Artículos</div>
            ${itemsHtml}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); font-size: var(--font-size-lg); font-weight: 800; border-top: 1px solid var(--border-color); padding-top: var(--space-3);">
            <span>TOTAL FACTURADO:</span>
            <span style="color: var(--success-text);">Q${c.montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: var(--font-size-xs); color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: var(--space-3);">
            <div>
              <strong>Fecha:</strong> ${fecha}
            </div>
            <div>
              <strong>Registrado por:</strong> ${c.registradoPor?.nombre || 'Vendedor'}
            </div>
            <div style="grid-column: span 2;">
              <strong>Observaciones:</strong> ${c.observaciones || 'Sin comentarios'}
            </div>
          </div>
        `;

        compraDetalleModal.classList.add('open');
      }
    } catch (err) {
      window.showToast('Error al cargar los detalles de la compra', 'error');
    }
  }
});
