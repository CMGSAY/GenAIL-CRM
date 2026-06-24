// ============================================
// GenAIL CRM — Controlador de Autenticación
// Archivo: /backend/controllers/authController.js
// Propósito: Gestionar login, registro, recuperación y perfil
// ============================================

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const { registrarActividad } = require('../services/bitacoraService');

// Helper para generar token JWT
const generarToken = (id, nombre, rol) => {
  return jwt.sign(
    { id, nombre, rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

/**
 * @desc    Iniciar sesión
 * @route   POST /api/auth/login
 * @access  Público
 */
const login = async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    // 1. Validar campos
    if (!correo || !contraseña) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, ingrese correo y contraseña'
      });
    }

    // 2. Buscar usuario
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      // Registrar intento fallido
      await registrarActividad({
        accion: 'LOGIN_FALLIDO',
        modulo: 'autenticacion',
        descripcion: `Intento de login fallido: correo no encontrado (${correo})`,
        req
      });

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // 3. Verificar estado
    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Su cuenta está inactiva. Contacte al administrador.'
      });
    }

    // 4. Comparar contraseñas
    const contraseñaCorrecta = await usuario.compararContraseña(contraseña);

    if (!contraseñaCorrecta) {
      // Registrar intento fallido
      await registrarActividad({
        accion: 'LOGIN_FALLIDO',
        modulo: 'autenticacion',
        descripcion: `Intento de login fallido: contraseña incorrecta para ${correo}`,
        usuarioId: usuario._id,
        nombreUsuario: usuario.nombre,
        req
      });

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // 5. Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save({ validateBeforeSave: false });

    // 6. Generar JWT
    const token = generarToken(usuario._id, usuario.nombre, usuario.rol);

    // 7. Registrar actividad en la bitácora
    await registrarActividad({
      accion: 'LOGIN',
      modulo: 'autenticacion',
      descripcion: `Sesión iniciada correctamente`,
      usuarioId: usuario._id,
      nombreUsuario: usuario.nombre,
      req
    });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * @desc    Registrar un nuevo usuario (Creado por administrador o bootstrap inicial)
 * @route   POST /api/auth/registro
 * @access  Admin / Público (si es el primer usuario)
 */
const registro = async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;

  try {
    // 1. Verificar si ya existen usuarios en el sistema
    const totalUsuarios = await Usuario.countDocuments();
    
    // Si ya existen usuarios, requerir que el usuario que hace la petición esté autenticado y sea administrador
    if (totalUsuarios > 0) {
      if (!req.usuario || req.usuario.rol !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'No autorizado. Solo un administrador puede registrar usuarios.'
        });
      }
    }

    // 2. Validar campos
    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({
        success: false,
        message: 'Por favor complete todos los campos requeridos'
      });
    }

    // 3. Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // 4. Determinar rol
    // Si es el primer usuario, se le asigna 'administrador' por defecto para bootstrap
    const rolFinal = totalUsuarios === 0 ? 'administrador' : (rol || 'empleado');

    // 5. Crear usuario
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      contraseña,
      rol: rolFinal
    });

    await nuevoUsuario.save();

    // 6. Registrar en bitácora
    await registrarActividad({
      accion: 'REGISTRO_USUARIO',
      modulo: 'autenticacion',
      descripcion: `Registró al usuario: ${correo} con rol ${rolFinal}`,
      usuarioId: req.usuario ? req.usuario._id : nuevoUsuario._id,
      nombreUsuario: req.usuario ? req.usuario.nombre : 'Sistema (Bootstrap)',
      req
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Recuperación de contraseña (Genera token temporal)
 * @route   POST /api/auth/recuperar
 * @access  Público
 */
const recuperarContraseña = async (req, res) => {
  const { correo } = req.body;

  try {
    if (!correo) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese su correo electrónico'
      });
    }

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'No existe un usuario con ese correo electrónico'
      });
    }

    // Generar token hex aleatorio de 20 bytes (40 caracteres)
    const token = crypto.randomBytes(20).toString('hex');

    // Asignar al usuario con 1 hora de expiración
    usuario.restablecerContraseñaToken = token;
    usuario.restablecerContraseñaExpiracion = Date.now() + 3600000; // 1 hora
    await usuario.save({ validateBeforeSave: false });

    // Registrar en bitácora
    await registrarActividad({
      accion: 'SOLICITUD_RECUPERACION',
      modulo: 'autenticacion',
      descripcion: `Solicitó restablecimiento de contraseña para ${correo}`,
      usuarioId: usuario._id,
      nombreUsuario: usuario.nombre,
      req
    });

    // Simulamos el envío de email imprimiendo en consola del servidor
    const enlaceReset = `http://localhost:5000/frontend/pages/login.html?reset=${token}`;
    console.log(`\n🔑 [RECUPERACIÓN] Enlace generado para ${correo}:\n${enlaceReset}\n`);

    res.json({
      success: true,
      message: 'Instrucciones enviadas al correo (simulado)',
      // Retornamos el token/url en desarrollo para pruebas de frontend inmediatas
      data: process.env.NODE_ENV === 'development' ? { token, enlaceReset } : {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en la solicitud de recuperación',
      error: error.message
    });
  }
};

/**
 * @desc    Restablecer contraseña con el token
 * @route   POST /api/auth/reset/:token
 * @access  Público
 */
const resetearContraseña = async (req, res) => {
  const { token } = req.params;
  const { nuevaContraseña } = req.body;

  try {
    if (!nuevaContraseña) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione la nueva contraseña'
      });
    }

    // Buscar el usuario por token y validar que no haya expirado
    const usuario = await Usuario.findOne({
      restablecerContraseñaToken: token,
      restablecerContraseñaExpiracion: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de recuperación es inválido o ha expirado'
      });
    }

    // Asignar nueva contraseña y limpiar campos de recuperación
    usuario.contraseña = nuevaContraseña;
    usuario.restablecerContraseñaToken = undefined;
    usuario.restablecerContraseñaExpiracion = undefined;
    await usuario.save();

    // Registrar en bitácora
    await registrarActividad({
      accion: 'RESTABLECER_CONTRASENA',
      modulo: 'autenticacion',
      descripcion: `Contraseña restablecida correctamente`,
      usuarioId: usuario._id,
      nombreUsuario: usuario.nombre,
      req
    });

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener perfil del usuario actual
 * @route   GET /api/auth/perfil
 * @access  Autenticado
 */
const obtenerPerfil = async (req, res) => {
  res.json({
    success: true,
    message: 'Perfil de usuario obtenido',
    data: {
      usuario: req.usuario
    }
  });
};

/**
 * @desc    Chequear si el sistema está inicializado (si existe algún usuario)
 * @route   GET /api/auth/inicializado
 * @access  Público
 */
const chequearInicializado = async (req, res) => {
  try {
    const count = await Usuario.countDocuments();
    res.json({
      success: true,
      data: {
        inicializado: count > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar inicialización del sistema',
      error: error.message
    });
  }
};

module.exports = {
  login,
  registro,
  recuperarContraseña,
  resetearContraseña,
  obtenerPerfil,
  chequearInicializado
};
