// ============================================
// GenAIL CRM — Middleware de Autorización por Roles
// Archivo: /backend/middlewares/rolMiddleware.js
// Propósito: Restringir acceso a endpoints según rol de usuario
// ============================================

/**
 * Middleware para validar que el usuario tenga al menos uno de los roles permitidos.
 * Debe colocarse después de protegerRuta (authMiddleware).
 * @param {...string} rolesPermitidos - Roles permitidos para consumir la ruta
 */
const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(500).json({
        success: false,
        message: 'Error de servidor: middleware de autenticación omitido'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso prohibido para el rol: ${req.usuario.rol}`
      });
    }

    next();
  };
};

module.exports = permitirRoles;
