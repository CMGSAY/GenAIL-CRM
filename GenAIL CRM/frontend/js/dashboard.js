/* ============================================
   GenAIL CRM — Lógica de Dashboard Ejecutivo
   Archivo: /frontend/js/dashboard.js
   Propósito: Cargar indicadores, instanciar gráficos
              con Chart.js y manejar restricciones de rol.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const employeeWarningCard = document.getElementById('employee-warning-card');
  const dashboardAdminView = document.getElementById('dashboard-admin-view');
  const btnRefresh = document.getElementById('btn-refresh-dashboard');

  // KPIs
  const kpiClientesTotales = document.getElementById('kpi-clientes-totales');
  const kpiClientesNuevos = document.getElementById('kpi-clientes-nuevos');
  const kpiVentasTotales = document.getElementById('kpi-ventas-totales');
  const kpiClientesPotenciales = document.getElementById('kpi-clientes-potenciales');
  const kpiSeguimientosPendientes = document.getElementById('kpi-seguimientos-pendientes');

  // Instancias de Gráficos (para destruir y recrear al actualizar)
  let chartVentas = null;
  let chartCategorias = null;
  let chartCrecimiento = null;

  // Variables de Sesión
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

  // --- Control de Acceso por Roles en el Frontend ---
  if (usuarioRol !== 'administrador') {
    employeeWarningCard.style.display = 'block';
    dashboardAdminView.style.display = 'none';
    return;
  }

  dashboardAdminView.style.display = 'block';

  // Cargar datos iniciales
  cargarDashboard();

  // Actualizar
  btnRefresh?.addEventListener('click', cargarDashboard);

  // Filtro de agrupación de ventas
  const filterVentasGrupo = document.getElementById('filter-ventas-grupo');
  filterVentasGrupo?.addEventListener('change', async (e) => {
    try {
      const agrupar = e.target.value;
      const ventasRes = await window.API.get(`/dashboard/ventas-mensuales?agrupar=${agrupar}`);
      if (ventasRes.success) {
        renderGraficoVentas(ventasRes.data.ventas, agrupar);
      }
    } catch (err) {
      window.showToast('Error al actualizar gráfico de ventas: ' + err.message, 'error');
    }
  });

  // --- Cargar Dashboard (KPIs + Gráficos) ---
  async function cargarDashboard() {
    try {
      // 1. Cargar KPIs
      const kpisRes = await window.API.get('/dashboard/indicadores');
      if (kpisRes.success) {
        const k = kpisRes.data;
        kpiClientesTotales.textContent = k.totalClientes;
        kpiClientesNuevos.textContent = `+${k.clientesNuevos} últimos 30 días`;
        kpiVentasTotales.textContent = `Q${k.ventasRegistradas.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
        kpiClientesPotenciales.textContent = k.clientesPotenciales;
        kpiSeguimientosPendientes.textContent = k.seguimientosPendientes;
      }

      // 2. Gráfico: Ventas Mensuales
      const agrupar = document.getElementById('filter-ventas-grupo')?.value || 'mes';
      const ventasRes = await window.API.get(`/dashboard/ventas-mensuales?agrupar=${agrupar}`);
      if (ventasRes.success) {
        renderGraficoVentas(ventasRes.data.ventas, agrupar);
      }

      // 3. Gráfico: Clientes por Categoría
      const catsRes = await window.API.get('/dashboard/clientes-categoria');
      if (catsRes.success) {
        renderGraficoCategorias(catsRes.data.distribucion);
      }

      // 4. Gráfico: Crecimiento Clientes
      const crecRes = await window.API.get('/dashboard/crecimiento');
      if (crecRes.success) {
        renderGraficoCrecimiento(crecRes.data.crecimiento);
      }

      window.showToast('Estadísticas actualizadas correctamente', 'success');
    } catch (err) {
      window.showToast('Error al actualizar estadísticas: ' + err.message, 'error');
    }
  }

  // --- Configuración de Estilos Comunes de Chart.js ---
  const chartDefaults = {
    color: '#94a3b8', // Color del texto
    borderColor: '#334155', // Líneas de cuadrícula
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { family: "'Inter', sans-serif", size: 11 }
        }
      }
    }
  };

  // --- Renderizar Gráfico: Ventas Mensuales (Línea) ---
  function renderGraficoVentas(ventas, agrupar = 'mes') {
    const ctx = document.getElementById('chart-ventas-mensuales').getContext('2d');
    
    if (chartVentas) chartVentas.destroy();

    const labels = ventas.map(v => v.mes);
    const data = ventas.map(v => v.monto);

    // Mapear títulos y leyendas según el tipo de agrupación
    let labelTitulo = 'Monto de Ventas Mensuales (Q)';
    let textoCabecera = '📊 Facturación Mensual (GTQ)';

    if (agrupar === 'dia') {
      labelTitulo = 'Monto de Ventas Diarias (Q)';
      textoCabecera = '📊 Facturación Diaria (GTQ)';
    } else if (agrupar === 'semana') {
      labelTitulo = 'Monto de Ventas Semanales (Q)';
      textoCabecera = '📊 Facturación Semanal (GTQ)';
    } else if (agrupar === 'anio') {
      labelTitulo = 'Monto de Ventas Anuales (Q)';
      textoCabecera = '📊 Facturación Anual (GTQ)';
    }

    const tituloHeader = document.getElementById('titulo-ventas-agrupadas');
    if (tituloHeader) {
      tituloHeader.textContent = textoCabecera;
    }

    chartVentas = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: labelTitulo,
          data,
          borderColor: '#6366f1', // Primary color
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#818cf8',
          pointHoverRadius: 7
        }]
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            grid: { color: chartDefaults.borderColor },
            ticks: {
              callback: (val) => 'Q' + val.toLocaleString()
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // --- Renderizar Gráfico: Distribución por Categorías (Dona) ---
  function renderGraficoCategorias(dist) {
    const ctx = document.getElementById('chart-clientes-categoria').getContext('2d');
    
    if (chartCategorias) chartCategorias.destroy();

    chartCategorias = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Premium', 'Frecuente', 'Potencial'],
        datasets: [{
          data: [dist.premium, dist.frecuente, dist.potencial],
          backgroundColor: [
            '#10b981', // Premium (Green)
            '#6366f1', // Frecuente (Indigo)
            '#fbbf24'  // Potencial (Yellow)
          ],
          borderColor: '#1e293b', // Match card background
          borderWidth: 2
        }]
      },
      options: {
        ...chartDefaults,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          }
        }
      }
    });
  }

  // --- Renderizar Gráfico: Adquisición de Clientes (Barras) ---
  function renderGraficoCrecimiento(crecimiento) {
    const ctx = document.getElementById('chart-clientes-crecimiento').getContext('2d');
    
    if (chartCrecimiento) chartCrecimiento.destroy();

    const labels = crecimiento.map(c => c.mes);
    const data = crecimiento.map(c => c.cantidad);

    chartCrecimiento = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Clientes Nuevos Registrados',
          data,
          backgroundColor: '#34d399', // Accent Green
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            grid: { color: chartDefaults.borderColor },
            ticks: { stepSize: 1 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
});
