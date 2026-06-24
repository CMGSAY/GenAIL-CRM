// ============================================
// GenAIL CRM — Middleware de Autenticación JWT
// Archivo: /backend/middlewares/authMiddleware.js
// Propósito: Validar el token JWT enviado en los headers
// ============================================

const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Middleware para proteger rutas que requieren autenticación.
 * Valida el token Bearer JWT e inyecta al usuario actual en `req.usuario`.
 */
const protegerRuta = async (req, res, next) => {
  let token;

  // 1. Obtener token del header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, no se proporcionó token'
    });
  }

  try {
    // 2. Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Buscar el usuario asociado en la DB (excluyendo la contraseña)
    const usuario = await Usuario.findById(decoded.id).select('-contraseña');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, el usuario no existe'
      });
    }

    // 4. Verificar que el usuario esté activo
    if (usuario.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, cuenta inactiva o suspendida'
      });
    }

    // 5. Inyectar usuario en el request
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error de verificación JWT:', error.message);
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token inválido o expirado'
    });
  }
};

module.exports = protegerRuta;
