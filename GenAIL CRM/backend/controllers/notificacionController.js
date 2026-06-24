// ============================================
// GenAIL CRM — Controlador de Notificaciones
// Archivo: /backend/controllers/notificacionController.js
// Propósito: Consultar notificaciones, marcar lectura y contar no leídas
// ============================================

const Notificacion = require('../models/Notificacion');
const { generarAlertasAutomaticas } = require('../services/notificacionService');

/**
 * @desc    Obtener notificaciones del usuario autenticado (corre reglas antes)
 * @route   GET /api/notificaciones
 * @access  Autenticado
 */
const obtenerNotificaciones = async (req, res) => {
  try {
    // 1. Correr reglas automáticas antes de listar
    await generarAlertasAutomaticas(req.usuario);

    // 2. Traer notificaciones ordenadas por más reciente
    const notificaciones = await Notificacion.find({ usuarioId: req.usuario._id })
      .sort({ createdAt: -1 })
      .limit(50); // Traer máximo 50 más recientes

    res.json({
      success: true,
      message: 'Notificaciones obtenidas exitosamente',
      data: { notificaciones }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

/**
 * @desc    Contar notificaciones no leídas
 * @route   GET /api/notificaciones/count
 * @access  Autenticado
 */
const obtenerConteoNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({ 
      usuarioId: req.usuario._id, 
      leida: false 
    });

    res.json({
      success: true,
      message: 'Conteo de no leídas obtenido',
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener conteo',
      error: error.message
    });
  }
};

/**
 * @desc    Marcar una notificación como leída
 * @route   PATCH /api/notificaciones/:id/leer
 * @access  Autenticado
 */
const marcarComoLeida = async (req, res) => {
  try {
    const notif = await Notificacion.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Asegurar que le pertenece al usuario
    if (notif.usuarioId.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para modificar esta notificación'
      });
    }

    notif.leida = true;
    await notif.save();

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: { notificacion: notif }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar la notificación',
      error: error.message
    });
  }
};

/**
 * @desc    Marcar todas las notificaciones como leídas
 * @route   PATCH /api/notificaciones/leer-todas
 * @access  Autenticado
 */
const marcarTodasComoLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany(
      { usuarioId: req.usuario._id, leida: false },
      { leida: true }
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas las notificaciones',
      error: error.message
    });
  }
};

module.exports = {
  obtenerNotificaciones,
  obtenerConteoNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas
};
