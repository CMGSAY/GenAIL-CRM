// ============================================
// GenAIL CRM — Controlador de Bitácora
// Archivo: /backend/controllers/bitacoraController.js
// Propósito: Consultar y filtrar los registros de auditoría (solo admin)
// ============================================

const Bitacora = require('../models/Bitacora');

/**
 * @desc    Obtener lista paginada y filtrada de auditoría
 * @route   GET /api/bitacora
 * @access  Administrador
 */
const obtenerBitacora = async (req, res) => {
  try {
    const { page = 1, limit = 20, modulo, accion, usuario } = req.query;

    const query = {};

    // Filtros por módulo y acción
    if (modulo) query.modulo = modulo;
    if (accion) query.accion = accion;

    // Filtro por coincidencia parcial en nombre de usuario
    if (usuario) {
      query.nombreUsuario = { $regex: usuario, $options: 'i' };
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Bitacora.countDocuments(query);
    const registros = await Bitacora.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      message: 'Registros de bitácora obtenidos',
      data: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        registros
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la bitácora',
      error: error.message
    });
  }
};

module.exports = {
  obtenerBitacora
};
