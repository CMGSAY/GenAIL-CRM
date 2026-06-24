// ============================================
// GenAIL CRM — Rutas de Autenticación
// Archivo: /backend/routes/authRoutes.js
// Propósito: Definir endpoints de la API para Autenticación
// ============================================

const express = require('express');
const router = express.Router();
const {
  login,
  registro,
  recuperarContraseña,
  resetearContraseña,
  obtenerPerfil,
  chequearInicializado
} = require('../controllers/authController');
const protegerRuta = require('../middlewares/authMiddleware');

// Ruta pública para chequear si el sistema está inicializado (DB vacía)
router.get('/inicializado', chequearInicializado);

// Ruta pública para iniciar sesión
router.post('/login', login);

// Ruta para registrar usuarios. El controlador maneja dinámicamente si es público (bootstrap) o requiere administrador
router.post('/registro', (req, res, next) => {
  // Intentamos validar si hay un token. Si existe, pasa por protegerRuta
  if (req.headers.authorization) {
    return protegerRuta(req, res, next);
  }
  // Si no hay token, delegamos al controlador que validará si es la instalación inicial
  next();
}, registro);

// Ruta pública para solicitar recuperación
router.post('/recuperar', recuperarContraseña);

// Ruta pública para restablecer con token
router.post('/reset/:token', resetearContraseña);

// Ruta protegida para ver perfil propio
router.get('/perfil', protegerRuta, obtenerPerfil);

module.exports = router;
