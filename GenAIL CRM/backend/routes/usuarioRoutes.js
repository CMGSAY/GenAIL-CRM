// ============================================
// GenAIL CRM — Rutas de Gestión de Usuarios
// Archivo: /backend/routes/usuarioRoutes.js
// Propósito: Definir endpoints de control de usuarios del sistema (solo admin)
// ============================================

const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  actualizarEstadoUsuario
} = require('../controllers/usuarioController');
const protegerRuta = require('../middlewares/authMiddleware');
const permitirRoles = require('../middlewares/rolMiddleware');

// Proteger todas las rutas y restringir a Administrador
router.use(protegerRuta);
router.use(permitirRoles('administrador'));

router.route('/')
  .get(obtenerUsuarios)
  .post(crearUsuario);

router.route('/:id')
  .get(obtenerUsuarioPorId)
  .put(actualizarUsuario);

router.patch('/:id/estado', actualizarEstadoUsuario);

module.exports = router;
