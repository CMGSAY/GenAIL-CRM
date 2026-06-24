// ============================================
// GenAIL CRM — Controlador de Compras
// Archivo: /backend/controllers/compraController.js
// Propósito: Gestionar el historial comercial de clientes,
//            actualizar contadores y recalcular categorías.
// ============================================

const Compra = require('../models/Compra');
const Cliente = require('../models/Cliente');
const { registrarActividad } = require('../services/bitacoraService');
const { actualizarSegmentoCliente } = require('../services/segmentacionService');

/**
 * @desc    Registrar una compra para un cliente
 * @route   POST /api/compras
 * @access  Autenticado
 */
const registrarCompra = async (req, res) => {
  const { clienteId, productos, observaciones, fecha } = req.body;

  try {
    // 1. Validar campos mínimos
    if (!clienteId || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar un cliente y al menos un producto'
      });
    }

    // 2. Verificar que el cliente existe y está activo
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    if (cliente.estado !== 'activo') {
      return res.status(400).json({
        success: false,
        message: 'No se pueden registrar compras a clientes inactivos'
      });
    }

    // 3. Procesar y calcular subtotales de productos
    let calculoMontoTotal = 0;
    const productosProcesados = productos.map(p => {
      const cantidad = parseInt(p.cantidad) || 0;
      const precioUnitario = parseFloat(p.precioUnitario) || 0;
      const subtotal = cantidad * precioUnitario;
      calculoMontoTotal += subtotal;

      return {
        nombre: p.nombre,
        cantidad,
        precioUnitario,
        subtotal
      };
    });

    // 4. Crear la compra
    const compra = new Compra({
      clienteId,
      productos: productosProcesados,
      montoTotal: calculoMontoTotal,
      fecha: fecha || new Date(),
      observaciones,
      registradoPor: req.usuario._id
    });

    await compra.save();

    // 5. Actualizar contadores desnormalizados en el cliente
    cliente.totalCompras += calculoMontoTotal;
    cliente.cantidadCompras += 1;
    cliente.ultimaActividad = fecha || new Date();

    // 6. Recalcular categoría del cliente (Segmentación automática)
    await actualizarSegmentoCliente(cliente);
    await cliente.save();

    // 7. Registrar acción en bitácora
    await registrarActividad({
      accion: 'REGISTRAR_COMPRA',
      modulo: 'compras',
      descripcion: `Registró compra de Q${calculoMontoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })} para el cliente ${cliente.nombre} ${cliente.apellidos}`,
      documentoId: compra._id,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: { compra }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar la compra',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener el historial de compras de un cliente específico
 * @route   GET /api/compras/cliente/:clienteId
 * @access  Autenticado
 */
const obtenerComprasPorCliente = async (req, res) => {
  const { clienteId } = req.params;

  try {
    const compras = await Compra.find({ clienteId })
      .populate('registradoPor', 'nombre')
      .sort({ fecha: -1 });

    res.json({
      success: true,
      message: 'Historial de compras obtenido',
      data: { compras }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de compras',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener detalles de una compra por ID
 * @route   GET /api/compras/:id
 * @access  Autenticado
 */
const obtenerCompraPorId = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
      .populate('clienteId', 'nombre apellidos empresa correo telefono')
      .populate('registradoPor', 'nombre');

    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de compra obtenido',
      data: { compra }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la compra',
      error: error.message
    });
  }
};

module.exports = {
  registrarCompra,
  obtenerComprasPorCliente,
  obtenerCompraPorId
};
