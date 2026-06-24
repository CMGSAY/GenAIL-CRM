// ============================================
// GenAIL CRM — Rutas de Seguimientos
// Archivo: /backend/routes/seguimientoRoutes.js
// Propósito: Definir endpoints para la gestión de interacciones y recordatorios
// ============================================

const express = require('express');
const router = express.Router();
const {
  crearSeguimiento,
  obtenerSeguimientosPorCliente,
  obtenerSeguimientosPendientes,
  actualizarSeguimiento,
  completarSeguimiento
} = require('../controllers/seguimientoController');
const protegerRuta = require('../middlewares/authMiddleware');

// Proteger todas las rutas con JWT
router.use(protegerRuta);

router.post('/', crearSeguimiento);
router.get('/pendientes', obtenerSeguimientosPendientes);
router.get('/cliente/:clienteId', obtenerSeguimientosPorCliente);

router.route('/:id')
  .put(actualizarSeguimiento);

router.patch('/:id/completar', completarSeguimiento);

module.exports = router;
