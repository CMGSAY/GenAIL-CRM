// ============================================
// GenAIL CRM — Controlador de Seguimientos
// Archivo: /backend/controllers/seguimientoController.js
// Propósito: Registrar interacciones con clientes, programar
//            recordatorios de próximas acciones y completar tareas.
// ============================================

const Seguimiento = require('../models/Seguimiento');
const Cliente = require('../models/Cliente');
const { registrarActividad } = require('../services/bitacoraService');

/**
 * @desc    Registrar una nueva interacción de seguimiento
 * @route   POST /api/seguimientos
 * @access  Autenticado
 */
const crearSeguimiento = async (req, res) => {
  const { clienteId, tipo, descripcion, fecha, proximaAccion, fechaProxima } = req.body;

  try {
    // 1. Validar campos
    if (!clienteId || !tipo || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el cliente, el tipo de interacción y una descripción'
      });
    }

    // 2. Verificar que el cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // 3. Crear seguimiento
    // Si se programa una próxima acción, completado es false por defecto
    const tieneProximaAccion = !!fechaProxima;
    
    const seguimiento = new Seguimiento({
      clienteId,
      tipo,
      descripcion,
      fecha: fecha || new Date(),
      proximaAccion,
      fechaProxima: fechaProxima || undefined,
      completado: tieneProximaAccion ? false : true, // Si no hay próxima acción, se considera finalizado
      realizadoPor: req.usuario._id
    });

    await seguimiento.save();

    // 4. Actualizar fecha de última actividad en el cliente
    cliente.ultimaActividad = fecha || new Date();
    await cliente.save();

    // 5. Registrar en la bitácora
    await registrarActividad({
      accion: 'CREAR_SEGUIMIENTO',
      modulo: 'seguimientos',
      descripcion: `Registró seguimiento de tipo ${tipo} para cliente ${cliente.nombre} ${cliente.apellidos}`,
      documentoId: seguimiento._id,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Seguimiento registrado exitosamente',
      data: { seguimiento }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar el seguimiento',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener todas las interacciones de seguimiento de un cliente
 * @route   GET /api/seguimientos/cliente/:clienteId
 * @access  Autenticado
 */
const obtenerSeguimientosPorCliente = async (req, res) => {
  const { clienteId } = req.params;

  try {
    const seguimientos = await Seguimiento.find({ clienteId })
      .populate('realizadoPor', 'nombre')
      .sort({ fecha: -1 });

    res.json({
      success: true,
      message: 'Historial de seguimientos obtenido',
      data: { seguimientos }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de seguimientos',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener seguimientos pendientes (recordatorios incompletos)
 * @route   GET /api/seguimientos/pendientes
 * @access  Autenticado
 */
const obtenerSeguimientosPendientes = async (req, res) => {
  try {
    const query = { completado: false };

    // Si es empleado, solo ve sus propios pendientes
    if (req.usuario.rol === 'empleado') {
      query.realizadoPor = req.usuario._id;
    }

    const pendientes = await Seguimiento.find(query)
      .populate('clienteId', 'nombre apellidos empresa correo telefono')
      .populate('realizadoPor', 'nombre')
      .sort({ fechaProxima: 1 }); // Primero los más urgentes/vencidos

    res.json({
      success: true,
      message: 'Seguimientos pendientes obtenidos',
      data: { pendientes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los seguimientos pendientes',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un seguimiento
 * @route   PUT /api/seguimientos/:id
 * @access  Autenticado
 */
const actualizarSeguimiento = async (req, res) => {
  const { tipo, descripcion, proximaAccion, fechaProxima, completado } = req.body;

  try {
    const seguimiento = await Seguimiento.findById(req.params.id);

    if (!seguimiento) {
      return res.status(404).json({
        success: false,
        message: 'Seguimiento no encontrado'
      });
    }

    // Validar propiedad del registro
    if (req.usuario.rol === 'empleado' && seguimiento.realizadoPor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para modificar este seguimiento'
      });
    }

    seguimiento.tipo = tipo || seguimiento.tipo;
    seguimiento.descripcion = descripcion || seguimiento.descripcion;
    seguimiento.proximaAccion = proximaAccion !== undefined ? proximaAccion : seguimiento.proximaAccion;
    seguimiento.fechaProxima = fechaProxima !== undefined ? fechaProxima : seguimiento.fechaProxima;
    
    if (completado !== undefined) {
      seguimiento.completado = completado;
    }

    await seguimiento.save();

    // Actualizar actividad del cliente
    await Cliente.findByIdAndUpdate(seguimiento.clienteId, { ultimaActividad: new Date() });

    // Registrar en bitácora
    await registrarActividad({
      accion: 'EDITAR_SEGUIMIENTO',
      modulo: 'seguimientos',
      descripcion: `Actualizó registro de seguimiento ID: ${seguimiento._id}`,
      documentoId: seguimiento._id,
      req
    });

    res.json({
      success: true,
      message: 'Seguimiento actualizado exitosamente',
      data: { seguimiento }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el seguimiento',
      error: error.message
    });
  }
};

/**
 * @desc    Marcar la próxima acción de un seguimiento como completada
 * @route   PATCH /api/seguimientos/:id/completar
 * @access  Autenticado
 */
const completarSeguimiento = async (req, res) => {
  try {
    const seguimiento = await Seguimiento.findById(req.params.id);

    if (!seguimiento) {
      return res.status(404).json({
        success: false,
        message: 'Seguimiento no encontrado'
      });
    }

    // Validar propiedad
    if (req.usuario.rol === 'empleado' && seguimiento.realizadoPor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para completar esta tarea'
      });
    }

    seguimiento.completado = true;
    await seguimiento.save();

    // Actualizar actividad del cliente
    await Cliente.findByIdAndUpdate(seguimiento.clienteId, { ultimaActividad: new Date() });

    // Registrar en bitácora
    await registrarActividad({
      accion: 'COMPLETAR_SEGUIMIENTO',
      modulo: 'seguimientos',
      descripcion: `Completó acción programada: "${seguimiento.proximaAccion}"`,
      documentoId: seguimiento._id,
      req
    });

    res.json({
      success: true,
      message: 'Acción de seguimiento marcada como completada',
      data: { seguimiento }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al completar la acción de seguimiento',
      error: error.message
    });
  }
};

module.exports = {
  crearSeguimiento,
  obtenerSeguimientosPorCliente,
  obtenerSeguimientosPendientes,
  actualizarSeguimiento,
  completarSeguimiento
};
