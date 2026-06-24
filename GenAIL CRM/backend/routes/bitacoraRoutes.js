// ============================================
// GenAIL CRM — Rutas de Bitácora
// Archivo: /backend/routes/bitacoraRoutes.js
// Propósito: Definir endpoints de consulta para la bitácora de auditoría (solo admin)
// ============================================

const express = require('express');
const router = express.Router();
const { obtenerBitacora } = require('../controllers/bitacoraController');
const protegerRuta = require('../middlewares/authMiddleware');
const permitirRoles = require('../middlewares/rolMiddleware');

// Proteger ruta con JWT y restringir a Administrador
router.use(protegerRuta);
router.use(permitirRoles('administrador'));

router.get('/', obtenerBitacora);

module.exports = router;
