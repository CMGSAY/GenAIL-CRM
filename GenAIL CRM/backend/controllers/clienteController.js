// ============================================
// GenAIL CRM — Controlador de Clientes
// Archivo: /backend/controllers/clienteController.js
// Propósito: Gestionar CRUD de clientes, búsquedas,
//            filtrados, desactivaciones y bitácora.
// ============================================

const Cliente = require('../models/Cliente');
const { registrarActividad } = require('../services/bitacoraService');

/**
 * @desc    Crear un cliente nuevo
 * @route   POST /api/clientes
 * @access  Autenticado
 */
const crearCliente = async (req, res) => {
  const { nombre, apellidos, telefono, correo, direccion, empresa } = req.body;

  try {
    // 1. Regla de Negocio: Debe existir al menos un medio de contacto (teléfono o correo)
    if (!telefono && !correo) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un medio de contacto (teléfono o correo electrónico)'
      });
    }

    // 2. Regla de Negocio: No se permiten correos duplicados
    if (correo) {
      const correoDuplicado = await Cliente.findOne({ correo });
      if (correoDuplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente registrado con este correo electrónico'
        });
      }
    }

    // 3. Crear cliente
    const cliente = new Cliente({
      nombre,
      apellidos,
      telefono: telefono || undefined,
      correo: correo || undefined,
      direccion,
      empresa,
      registradoPor: req.usuario._id
    });

    await cliente.save();

    // 4. Registrar en bitácora
    await registrarActividad({
      accion: 'CREAR_CLIENTE',
      modulo: 'clientes',
      descripcion: `Creó al cliente: ${nombre} ${apellidos} (${empresa || 'Particular'})`,
      documentoId: cliente._id,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: { cliente }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear el cliente',
      error: error.message
    });
  }
};

/**
 * @desc    Listar clientes con filtros, búsqueda y paginación
 * @route   GET /api/clientes
 * @access  Autenticado
 */
const obtenerClientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, categoria, busqueda } = req.query;

    const query = {};

    // Filtros por estado y categoría
    if (estado) query.estado = estado;
    if (categoria) query.categoria = categoria;

    // Búsqueda (Texto completo o Regex para coincidencias parciales)
    if (busqueda) {
      query.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { apellidos: { $regex: busqueda, $options: 'i' } },
        { empresa: { $regex: busqueda, $options: 'i' } },
        { correo: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Cliente.countDocuments(query);
    const clientes = await Cliente.find(query)
      .populate('registradoPor', 'nombre correo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      message: 'Clientes obtenidos exitosamente',
      data: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        clientes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los clientes',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener detalles de un cliente
 * @route   GET /api/clientes/:id
 * @access  Autenticado
 */
const obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id).populate('registradoPor', 'nombre correo');

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de cliente obtenido',
      data: { cliente }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el cliente',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un cliente
 * @route   PUT /api/clientes/:id
 * @access  Autenticado
 */
const actualizarCliente = async (req, res) => {
  const { nombre, apellidos, telefono, correo, direccion, empresa } = req.body;

  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // 1. Regla de Negocio: Debe existir al menos un medio de contacto
    if (!telefono && !correo) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un medio de contacto (teléfono o correo electrónico)'
      });
    }

    // 2. Regla de Negocio: No se permiten correos duplicados
    if (correo && correo !== cliente.correo) {
      const correoDuplicado = await Cliente.findOne({ correo });
      if (correoDuplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente registrado con este correo electrónico'
        });
      }
    }

    // Actualizar campos
    cliente.nombre = nombre || cliente.nombre;
    cliente.apellidos = apellidos || cliente.apellidos;
    cliente.telefono = telefono === '' ? undefined : (telefono || cliente.telefono);
    cliente.correo = correo === '' ? undefined : (correo || cliente.correo);
    cliente.direccion = direccion !== undefined ? direccion : cliente.direccion;
    cliente.empresa = empresa !== undefined ? empresa : cliente.empresa;
    cliente.ultimaActividad = new Date();

    await cliente.save();

    // Registrar en bitácora
    await registrarActividad({
      accion: 'EDITAR_CLIENTE',
      modulo: 'clientes',
      descripcion: `Actualizó información de cliente: ${cliente.nombre} ${cliente.apellidos}`,
      documentoId: cliente._id,
      req
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: { cliente }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el cliente',
      error: error.message
    });
  }
};

/**
 * @desc    Activar o desactivar un cliente (Soft Delete)
 * @route   PATCH /api/clientes/:id/estado
 * @access  Autenticado
 */
const actualizarEstadoCliente = async (req, res) => {
  const { estado } = req.body;

  try {
    if (!estado || !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser activo o inactivo'
      });
    }

    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    cliente.estado = estado;
    cliente.ultimaActividad = new Date();
    await cliente.save();

    // Registrar en bitácora
    const accion = estado === 'activo' ? 'ACTIVAR_CLIENTE' : 'DESACTIVAR_CLIENTE';
    await registrarActividad({
      accion,
      modulo: 'clientes',
      descripcion: `${estado === 'activo' ? 'Activó' : 'Desactivó'} al cliente: ${cliente.nombre} ${cliente.apellidos}`,
      documentoId: cliente._id,
      req
    });

    res.json({
      success: true,
      message: `Cliente marcado como ${estado} exitosamente`,
      data: { cliente }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del cliente',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener clientes por categoría (Segmento)
 * @route   GET /api/clientes/segmento/:categoria
 * @access  Autenticado
 */
const obtenerClientesPorSegmento = async (req, res) => {
  const { categoria } = req.params;

  try {
    if (!['premium', 'frecuente', 'potencial', 'inactivo'].includes(categoria)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría o segmento inválido'
      });
    }

    const clientes = await Cliente.find({ categoria, estado: 'activo' })
      .populate('registradoPor', 'nombre correo');

    res.json({
      success: true,
      message: `Clientes en segmento ${categoria} obtenidos`,
      data: { clientes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes por segmento',
      error: error.message
    });
  }
};

module.exports = {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  actualizarEstadoCliente,
  obtenerClientesPorSegmento
};
