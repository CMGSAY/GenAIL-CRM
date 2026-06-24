// ============================================
// GenAIL CRM — Rutas de Clientes
// Archivo: /backend/routes/clienteRoutes.js
// Propósito: Definir endpoints para la gestión de clientes
// ============================================

const express = require('express');
const router = express.Router();
const {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  actualizarEstadoCliente,
  obtenerClientesPorSegmento
} = require('../controllers/clienteController');
const protegerRuta = require('../middlewares/authMiddleware');

// Proteger todas las rutas de clientes con JWT
router.use(protegerRuta);

// CRUD básico y listados filtrados
router.route('/')
  .get(obtenerClientes)
  .post(crearCliente);

router.get('/segmento/:categoria', obtenerClientesPorSegmento);

router.route('/:id')
  .get(obtenerClientePorId)
  .put(actualizarCliente);

router.patch('/:id/estado', actualizarEstadoCliente);

module.exports = router;
