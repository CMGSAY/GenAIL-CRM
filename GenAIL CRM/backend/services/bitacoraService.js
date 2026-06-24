// ============================================
// GenAIL CRM — Servicio de Bitácora
// Archivo: /backend/services/bitacoraService.js
// Propósito: Registrar acciones del sistema en la DB
// ============================================

const Bitacora = require('../models/Bitacora');

/**
 * Registra una entrada en la bitácora de auditoría de forma asíncrona.
 * No bloquea la respuesta del controlador principal.
 * 
 * @param {Object} params - Parámetros del registro
 * @param {string} params.accion - Nombre de la acción realizada (ej: "LOGIN")
 * @param {string} params.modulo - Módulo afectado (ej: "autenticacion")
 * @param {string} params.descripcion - Detalle legible de la acción
 * @param {string} [params.usuarioId] - ID del usuario ejecutor (opcional)
 * @param {string} [params.nombreUsuario] - Nombre del usuario ejecutor (opcional)
 * @param {string} [params.documentoId] - ID del documento afectado (opcional)
 * @param {Object} [params.req] - Objeto Request de Express para capturar IP y User Agent
 */
const registrarActividad = async ({
  accion,
  modulo,
  descripcion,
  usuarioId,
  nombreUsuario,
  documentoId,
  req
}) => {
  try {
    let finalUsuarioId = usuarioId;
    let finalNombreUsuario = nombreUsuario || 'Sistema/Invitado';
    let ip = '127.0.0.1';
    let userAgent = 'Desconocido';

    // Si se pasa el objeto req, extraer información del usuario e IP
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ip;
      userAgent = req.headers['user-agent'] || userAgent;

      if (req.usuario) {
        finalUsuarioId = req.usuario._id;
        finalNombreUsuario = req.usuario.nombre;
      }
    }

    // Formatear hora: "10:15 AM"
    const ahora = new Date();
    let horas = ahora.getHours();
    const minutos = ahora.getMinutes();
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12; // La hora '0' debe ser '12'
    const minutosFormateados = minutos < 10 ? '0' + minutos : minutos;
    const horaFormateada = `${horas}:${minutosFormateados} ${ampm}`;

    // Crear y guardar el registro
    const registro = new Bitacora({
      usuarioId: finalUsuarioId,
      nombreUsuario: finalNombreUsuario,
      accion,
      modulo,
      descripcion,
      documentoId,
      ip,
      userAgent,
      fecha: ahora,
      hora: horaFormateada
    });

    await registro.save();
  } catch (error) {
    console.error('❌ Error al escribir en la bitácora:', error.message);
  }
};

module.exports = {
  registrarActividad
};
