// ============================================
// GenAIL CRM — Rutas de Compras
// Archivo: /backend/routes/compraRoutes.js
// Propósito: Definir endpoints para la gestión de compras
// ============================================

const express = require('express');
const router = express.Router();
const {
  registrarCompra,
  obtenerComprasPorCliente,
  obtenerCompraPorId
} = require('../controllers/compraController');
const protegerRuta = require('../middlewares/authMiddleware');

// Proteger todas las rutas de compras con JWT
router.use(protegerRuta);

router.post('/', registrarCompra);
router.get('/cliente/:clienteId', obtenerComprasPorCliente);
router.get('/:id', obtenerCompraPorId);

module.exports = router;
