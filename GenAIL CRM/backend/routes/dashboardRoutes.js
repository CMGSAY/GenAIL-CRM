// ============================================
// GenAIL CRM — Rutas de Dashboard
// Archivo: /backend/routes/dashboardRoutes.js
// Propósito: Definir endpoints estadísticos del dashboard ejecutivo (solo admin)
// ============================================

const express = require('express');
const router = express.Router();
const {
  obtenerIndicadores,
  obtenerVentasMensuales,
  obtenerClientesPorCategoria,
  obtenerCrecimientoClientes
} = require('../controllers/dashboardController');
const protegerRuta = require('../middlewares/authMiddleware');
const permitirRoles = require('../middlewares/rolMiddleware');

// Proteger todas las rutas del dashboard. Solo accesible por el rol Administrador.
router.use(protegerRuta);
router.use(permitirRoles('administrador'));

router.get('/indicadores', obtenerIndicadores);
router.get('/ventas-mensuales', obtenerVentasMensuales);
router.get('/clientes-categoria', obtenerClientesPorCategoria);
router.get('/crecimiento', obtenerCrecimientoClientes);

module.exports = router;
