// ============================================
// GenAIL CRM — Controlador de Dashboard
// Archivo: /backend/controllers/dashboardController.js
// Propósito: Generar indicadores y estadísticas agregadas para el administrador
// ============================================

const Cliente = require('../models/Cliente');
const Compra = require('../models/Compra');
const Seguimiento = require('../models/Seguimiento');

/**
 * @desc    Obtener indicadores principales (KPIs)
 * @route   GET /api/dashboard/indicadores
 * @access  Administrador
 */
const obtenerIndicadores = async (req, res) => {
  try {
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);

    // 1. Total clientes activos
    const totalClientes = await Cliente.countDocuments({ estado: 'activo' });

    // 2. Clientes nuevos (últimos 30 días)
    const clientesNuevos = await Cliente.countDocuments({ 
      estado: 'activo', 
      createdAt: { $gte: hace30dias } 
    });

    // 3. Clientes potenciales
    const clientesPotenciales = await Cliente.countDocuments({ 
      estado: 'activo', 
      categoria: 'potencial' 
    });

    // 4. Clientes inactivos
    const clientesInactivos = await Cliente.countDocuments({ 
      estado: 'activo', 
      categoria: 'inactivo' 
    });

    // 5. Ventas totales registradas (Suma del montoTotal de todas las compras)
    const comprasSuma = await Compra.aggregate([
      { $group: { _id: null, total: { $sum: '$montoTotal' } } }
    ]);
    const ventasRegistradas = comprasSuma.length > 0 ? comprasSuma[0].total : 0;

    // 6. Seguimientos pendientes totales
    const seguimientosPendientes = await Seguimiento.countDocuments({ completado: false });

    res.json({
      success: true,
      message: 'Indicadores obtenidos correctamente',
      data: {
        totalClientes,
        clientesNuevos,
        clientesPotenciales,
        clientesInactivos,
        ventasRegistradas,
        seguimientosPendientes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar indicadores',
      error: error.message
    });
  }
};

/**
 * @desc    Ventas mensuales (Suma agrupada por mes)
 * @route   GET /api/dashboard/ventas-mensuales
 * @access  Administrador
 */
const obtenerVentasMensuales = async (req, res) => {
  try {
    const ventas = await Compra.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$fecha' },
            month: { $month: '$fecha' }
          },
          total: { $sum: '$montoTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Formatear respuesta para el gráfico
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const resultado = ventas.map(v => ({
      mes: `${meses[v._id.month - 1]} ${v._id.year}`,
      monto: v.total,
      cantidad: v.count
    }));

    res.json({
      success: true,
      message: 'Ventas mensuales obtenidas',
      data: { ventas: resultado }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas mensuales',
      error: error.message
    });
  }
};

/**
 * @desc    Distribución de clientes por categoría (Segmento)
 * @route   GET /api/dashboard/clientes-categoria
 * @access  Administrador
 */
const obtenerClientesPorCategoria = async (req, res) => {
  try {
    const dist = await Cliente.aggregate([
      { $match: { estado: 'activo', categoria: { $ne: 'inactivo' } } },
      { $group: { _id: '$categoria', count: { $sum: 1 } } }
    ]);

    // Formatear como objeto clave-valor
    const resultado = {
      premium: 0,
      frecuente: 0,
      potencial: 0
    };

    dist.forEach(d => {
      if (resultado[d._id] !== undefined) {
        resultado[d._id] = d.count;
      }
    });

    res.json({
      success: true,
      message: 'Distribución por categoría obtenida',
      data: { distribucion: resultado }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener distribución por categorías',
      error: error.message
    });
  }
};

/**
 * @desc    Crecimiento de clientes por mes
 * @route   GET /api/dashboard/crecimiento
 * @access  Administrador
 */
const obtenerCrecimientoClientes = async (req, res) => {
  try {
    const crecimiento = await Cliente.aggregate([
      { $match: { estado: 'activo' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          nuevos: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const resultado = crecimiento.map(c => ({
      mes: `${meses[c._id.month - 1]} ${c._id.year}`,
      cantidad: c.nuevos
    }));

    res.json({
      success: true,
      message: 'Crecimiento de clientes obtenido',
      data: { crecimiento: resultado }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener crecimiento de clientes',
      error: error.message
    });
  }
};

module.exports = {
  obtenerIndicadores,
  obtenerVentasMensuales,
  obtenerClientesPorCategoria,
  obtenerCrecimientoClientes
};
