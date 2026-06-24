// ============================================
// GenAIL CRM — Rutas de Leads
// Archivo: /backend/routes/leadRoutes.js
// Propósito: Definir endpoints para la gestión de leads
// ============================================

const express = require('express');
const router = express.Router();
const {
  crearLead,
  obtenerLeads,
  obtenerLeadPorId,
  actualizarLead,
  actualizarEstadoLead
} = require('../controllers/leadController');
const protegerRuta = require('../middlewares/authMiddleware');

// Proteger todas las rutas de leads con JWT
router.use(protegerRuta);

router.route('/')
  .get(obtenerLeads)
  .post(crearLead);

router.route('/:id')
  .get(obtenerLeadPorId)
  .put(actualizarLead);

router.patch('/:id/estado', actualizarEstadoLead);

module.exports = router;
