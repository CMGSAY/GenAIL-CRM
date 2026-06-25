// ============================================
// GenAIL CRM — Controlador de Leads
// Archivo: /backend/controllers/leadController.js
// Propósito: Gestionar el embudo de ventas, oportunidades
//            de clientes y asignaciones de empleados.
// ============================================

const Lead = require('../models/Lead');
const Cliente = require('../models/Cliente');
const { registrarActividad } = require('../services/bitacoraService');

/**
 * @desc    Crear un lead nuevo (oportunidad comercial)
 * @route   POST /api/leads
 * @access  Autenticado
 */
const crearLead = async (req, res) => {
  const { clienteId, productoInteres, nivelInteres, valorEstimado, fechaCierre, notas, asignadoA } = req.body;

  try {
    // 1. Validar campos obligatorios
    if (!clienteId || !productoInteres) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el cliente y el producto de interés'
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

    // 3. Crear lead
    const lead = new Lead({
      clienteId,
      productoInteres,
      nivelInteres: nivelInteres || 'medio',
      valorEstimado: valorEstimado || 0,
      fechaCierre: fechaCierre || undefined,
      notas,
      asignadoA: asignadoA || req.usuario._id,
      creadoPor: req.usuario._id
    });

    await lead.save();

    // 4. Actualizar fecha de última actividad del cliente
    cliente.ultimaActividad = new Date();
    await cliente.save();

    // 5. Registrar en la bitácora
    await registrarActividad({
      accion: 'CREAR_LEAD',
      modulo: 'leads',
      descripcion: `Creó oportunidad de venta para ${cliente.nombre} ${cliente.apellidos} interesando en ${productoInteres}`,
      documentoId: lead._id,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Lead registrado exitosamente',
      data: { lead }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar el lead',
      error: error.message
    });
  }
};

/**
 * @desc    Listar todos los leads con filtros
 * @route   GET /api/leads
 * @access  Autenticado
 */
const obtenerLeads = async (req, res) => {
  try {
    const { estado, nivelInteres, asignadoA, ordenar } = req.query;

    const query = {};

    // Filtros por parámetros
    if (estado) query.estado = estado;
    if (nivelInteres) query.nivelInteres = nivelInteres;

    // Regla de rol: Los empleados solo ven sus leads asignados por defecto, 
    // a menos que se especifique un filtro y el admin consulte.
    if (req.usuario.rol === 'empleado') {
      query.asignadoA = req.usuario._id;
    } else if (asignadoA) {
      query.asignadoA = asignadoA;
    }

    const leads = await Lead.find(query)
      .populate('clienteId', 'nombre apellidos empresa correo telefono totalCompras')
      .populate('asignadoA', 'nombre correo')
      .populate('creadoPor', 'nombre');

    let leadsList = [...leads];

    if (ordenar === 'cliente_gasto') {
      leadsList.sort((a, b) => {
        const gastoA = a.clienteId?.totalCompras || 0;
        const gastoB = b.clienteId?.totalCompras || 0;
        return gastoB - gastoA;
      });
    } else if (ordenar === 'cliente_gasto_asc') {
      leadsList.sort((a, b) => {
        const gastoA = a.clienteId?.totalCompras || 0;
        const gastoB = b.clienteId?.totalCompras || 0;
        return gastoA - gastoB;
      });
    } else {
      // Orden por defecto: Fecha de creación descendente
      leadsList.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json({
      success: true,
      message: 'Leads obtenidos exitosamente',
      data: { leads: leadsList }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los leads',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener detalles de un lead
 * @route   GET /api/leads/:id
 * @access  Autenticado
 */
const obtenerLeadPorId = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('clienteId', 'nombre apellidos empresa correo telefono')
      .populate('asignadoA', 'nombre correo')
      .populate('creadoPor', 'nombre');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    // Si es empleado, asegurar que esté asignado a él
    if (req.usuario.rol === 'empleado' && lead.asignadoA._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para ver este lead'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de lead obtenido',
      data: { lead }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el lead',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar los datos de un lead
 * @route   PUT /api/leads/:id
 * @access  Autenticado
 */
const actualizarLead = async (req, res) => {
  const { productoInteres, nivelInteres, valorEstimado, fechaCierre, notas, asignadoA } = req.body;

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    // Validar autorización si es empleado
    if (req.usuario.rol === 'empleado' && lead.asignadoA.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para modificar este lead'
      });
    }

    // Actualizar campos
    lead.productoInteres = productoInteres || lead.productoInteres;
    lead.nivelInteres = nivelInteres || lead.nivelInteres;
    lead.valorEstimado = valorEstimado !== undefined ? valorEstimado : lead.valorEstimado;
    lead.fechaCierre = fechaCierre || lead.fechaCierre;
    lead.notas = notas !== undefined ? notas : lead.notas;
    
    if (asignadoA && req.usuario.rol === 'administrador') {
      lead.asignadoA = asignadoA;
    }

    await lead.save();

    // Actualizar última actividad del cliente
    await Cliente.findByIdAndUpdate(lead.clienteId, { ultimaActividad: new Date() });

    // Registrar en bitácora
    await registrarActividad({
      accion: 'EDITAR_LEAD',
      modulo: 'leads',
      descripcion: `Actualizó datos del lead para el producto: ${lead.productoInteres}`,
      documentoId: lead._id,
      req
    });

    res.json({
      success: true,
      message: 'Lead actualizado exitosamente',
      data: { lead }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el lead',
      error: error.message
    });
  }
};

/**
 * @desc    Cambiar el estado de un lead (Embudo de ventas)
 * @route   PATCH /api/leads/:id/estado
 * @access  Autenticado
 */
const actualizarEstadoLead = async (req, res) => {
  const { estado } = req.body;

  try {
    if (!estado || !['nuevo', 'contactado', 'en_negociacion', 'ganado', 'perdido'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de lead inválido'
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    // Validar autorización si es empleado
    if (req.usuario.rol === 'empleado' && lead.asignadoA.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No está autorizado para cambiar el estado de este lead'
      });
    }

    const anteriorEstado = lead.estado;
    lead.estado = estado;

    // Si el estado es ganado o perdido, fijar fecha real de cierre
    if (['ganado', 'perdido'].includes(estado)) {
      lead.fechaCierre = new Date();
    }

    await lead.save();

    // Actualizar última actividad del cliente
    await Cliente.findByIdAndUpdate(lead.clienteId, { ultimaActividad: new Date() });

    // Registrar en bitácora
    await registrarActividad({
      accion: 'ACTUALIZAR_ESTADO_LEAD',
      modulo: 'leads',
      descripcion: `Cambió estado del lead de "${anteriorEstado}" a "${estado}"`,
      documentoId: lead._id,
      req
    });

    res.json({
      success: true,
      message: `Estado del lead actualizado a ${estado} correctamente`,
      data: { lead }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del lead',
      error: error.message
    });
  }
};

module.exports = {
  crearLead,
  obtenerLeads,
  obtenerLeadPorId,
  actualizarLead,
  actualizarEstadoLead
};
