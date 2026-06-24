// ============================================
// GenAIL CRM — Rutas de Notificaciones
// Archivo: /backend/routes/notificacionRoutes.js
// Propósito: Definir endpoints para la consulta y control de alertas
// ============================================

const express = require('express');
const router = express.Router();
const {
  obtenerNotificaciones,
  obtenerConteoNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas
} = require('../controllers/notificacionController');
const protegerRuta = require('../middlewares/authMiddleware');

// Proteger todas las rutas de notificaciones con JWT
router.use(protegerRuta);

router.get('/', obtenerNotificaciones);
router.get('/count', obtenerConteoNoLeidas);
router.patch('/leer-todas', marcarTodasComoLeidas);
router.patch('/:id/leer', marcarComoLeida);

module.exports = router;
