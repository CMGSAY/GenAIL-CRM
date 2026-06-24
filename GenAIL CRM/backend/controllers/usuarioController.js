// ============================================
// GenAIL CRM — Controlador de Gestión de Usuarios
// Archivo: /backend/controllers/usuarioController.js
// Propósito: CRUD de usuarios (administradores y empleados, solo admin)
// ============================================

const Usuario = require('../models/Usuario');
const { registrarActividad } = require('../services/bitacoraService');

/**
 * @desc    Listar todos los usuarios
 * @route   GET /api/usuarios
 * @access  Administrador
 */
const obtenerUsuarios = async (req, res) => {
  try {
    const { estado } = req.query;
    const query = {};
    if (estado) query.estado = estado;

    const usuarios = await Usuario.find(query).select('-contraseña').sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: { usuarios }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener usuario por ID
 * @route   GET /api/usuarios/:id
 * @access  Administrador
 */
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-contraseña');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de usuario obtenido',
      data: { usuario }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Crear un nuevo usuario
 * @route   POST /api/usuarios
 * @access  Administrador
 */
const crearUsuario = async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;

  try {
    // 1. Validar campos
    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({
        success: false,
        message: 'Por favor complete todos los campos obligatorios'
      });
    }

    // 2. Verificar duplicado
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // 3. Crear usuario
    const usuario = new Usuario({
      nombre,
      correo,
      contraseña,
      rol: rol || 'empleado'
    });

    await usuario.save();

    // 4. Registrar en bitácora
    await registrarActividad({
      accion: 'CREAR_USUARIO',
      modulo: 'usuarios',
      descripcion: `Creó usuario: ${correo} con rol ${usuario.rol}`,
      documentoId: usuario._id,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          estado: usuario.estado
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear el usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un usuario
 * @route   PUT /api/usuarios/:id
 * @access  Administrador
 */
const actualizarUsuario = async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;

  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar correo duplicado
    if (correo && correo !== usuario.correo) {
      const correoDuplicado = await Usuario.findOne({ correo });
      if (correoDuplicado) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado por otro usuario'
        });
      }
    }

    // Prevenir auto-degradación de rol (ej: el admin actual se quita permisos)
    if (usuario._id.toString() === req.usuario._id.toString() && rol && rol !== 'administrador') {
      return res.status(400).json({
        success: false,
        message: 'No puede degradar su propio rol de administrador'
      });
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.correo = correo || usuario.correo;
    usuario.rol = rol || usuario.rol;

    // Si se pasa contraseña, se guardará y activará el hook de encriptación
    if (contraseña && contraseña.trim() !== '') {
      usuario.contraseña = contraseña;
    }

    await usuario.save();

    // Registrar en bitácora
    await registrarActividad({
      accion: 'EDITAR_USUARIO',
      modulo: 'usuarios',
      descripcion: `Actualizó datos del usuario: ${usuario.correo}`,
      documentoId: usuario._id,
      req
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          estado: usuario.estado
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Activar o desactivar un usuario
 * @route   PATCH /api/usuarios/:id/estado
 * @access  Administrador
 */
const actualizarEstadoUsuario = async (req, res) => {
  const { estado } = req.body;

  try {
    if (!estado || !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser activo o inactivo'
      });
    }

    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir auto-desactivación
    if (usuario._id.toString() === req.usuario._id.toString() && estado === 'inactivo') {
      return res.status(400).json({
        success: false,
        message: 'No puede desactivar su propia cuenta de administrador'
      });
    }

    usuario.estado = estado;
    await usuario.save();

    // Registrar en bitácora
    const accion = estado === 'activo' ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO';
    await registrarActividad({
      accion,
      modulo: 'usuarios',
      descripcion: `${estado === 'activo' ? 'Activó' : 'Desactivó'} cuenta de: ${usuario.correo}`,
      documentoId: usuario._id,
      req
    });

    res.json({
      success: true,
      message: `Usuario marcado como ${estado} exitosamente`,
      data: {
        usuario: {
          id: usuario._id,
          estado: usuario.estado
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  actualizarEstadoUsuario
};
