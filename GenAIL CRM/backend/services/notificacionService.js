// ============================================
// GenAIL CRM — Servicio de Notificaciones
// Archivo: /backend/services/notificacionService.js
// Propósito: Reglas de alertas comerciales y envío de notificaciones
// ============================================

const Notificacion = require('../models/Notificacion');
const Seguimiento = require('../models/Seguimiento');
const Lead = require('../models/Lead');
const Cliente = require('../models/Cliente');

/**
 * Crea una notificación para un usuario específico, verificando duplicados.
 */
const enviarNotificacion = async ({
  usuarioId,
  tipo,
  mensaje,
  referenciaId,
  referenciaTipo,
  diasExpiracion = 7
}) => {
  try {
    // 1. Evitar crear notificaciones duplicadas idénticas activas (no leídas)
    const existente = await Notificacion.findOne({
      usuarioId,
      tipo,
      referenciaId,
      leida: false
    });

    if (existente) return existente;

    // 2. Definir fecha de expiración para el índice TTL (default 7 días)
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

    const notif = new Notificacion({
      usuarioId,
      tipo,
      mensaje,
      referenciaId,
      referenciaTipo,
      fechaExpiracion
    });

    return await notif.save();
  } catch (error) {
    console.error('❌ Error al generar notificación:', error.message);
  }
};

/**
 * Analiza el estado del CRM y genera alertas automáticas para un usuario.
 * Se ejecuta al iniciar sesión o consultar notificaciones.
 * 
 * @param {Object} usuario - Documento del usuario actual
 */
const generarAlertasAutomaticas = async (usuario) => {
  const ahora = new Date();
  const usuarioId = usuario._id;
  const esAdmin = usuario.rol === 'administrador';

  try {
    // ========================================================
    // REGLA 1: Recordatorios de Seguimiento Pendientes (Hoy o vencidos)
    // ========================================================
    const querySeg = { completado: false, fechaProxima: { $lte: ahora } };
    if (!esAdmin) querySeg.realizadoPor = usuarioId;

    const segsVencidos = await Seguimiento.find(querySeg).populate('clienteId');
    for (const seg of segsVencidos) {
      if (seg.clienteId) {
        const msg = `Acción de seguimiento pendiente: "${seg.proximaAccion}" para el cliente ${seg.clienteId.nombre} ${seg.clienteId.apellidos}`;
        await enviarNotificacion({
          usuarioId: esAdmin ? seg.realizadoPor : usuarioId, // Si es admin, enviar al asignado
          tipo: 'seguimiento_pendiente',
          mensaje: msg,
          referenciaId: seg._id,
          referenciaTipo: 'Seguimiento'
        });
      }
    }

    // ========================================================
    // REGLA 2: Oportunidades (Leads) Próximas a Vencer (< 3 días)
    // ========================================================
    const limiteCierre = new Date();
    limiteCierre.setDate(limiteCierre.getDate() + 3);

    const queryLead = { 
      estado: 'en_negociacion', 
      fechaCierre: { $gte: ahora, $lte: limiteCierre } 
    };
    if (!esAdmin) queryLead.asignadoA = usuarioId;

    const leadsPorVencer = await Lead.find(queryLead).populate('clienteId');
    for (const lead of leadsPorVencer) {
      if (lead.clienteId) {
        const msg = `Oportunidad próxima a vencer para ${lead.clienteId.nombre} ${lead.clienteId.apellidos} (${lead.productoInteres})`;
        await enviarNotificacion({
          usuarioId: esAdmin ? lead.asignadoA : usuarioId,
          tipo: 'oportunidad_por_vencer',
          mensaje: msg,
          referenciaId: lead._id,
          referenciaTipo: 'Lead'
        });
      }
    }

    // ========================================================
    // REGLA 3: Clientes Importantes Sin Contacto Comercial (> 30 días)
    // ========================================================
    const limiteContacto = new Date();
    limiteContacto.setDate(limiteContacto.getDate() - 30);

    const queryCliente = {
      estado: 'activo',
      categoria: { $in: ['premium', 'frecuente'] },
      ultimaActividad: { $lte: limiteContacto }
    };
    if (!esAdmin) queryCliente.registradoPor = usuarioId;

    const clientesSinContacto = await Cliente.find(queryCliente);
    for (const cli of clientesSinContacto) {
      const msg = `Cliente importante sin contacto en los últimos 30 días: ${cli.nombre} ${cli.apellidos} (${cli.empresa || 'Particular'})`;
      await enviarNotificacion({
        usuarioId: esAdmin ? cli.registradoPor : usuarioId,
        tipo: 'cliente_sin_contacto',
        mensaje: msg,
        referenciaId: cli._id,
        referenciaTipo: 'Cliente'
      });
    }

  } catch (error) {
    console.error('❌ Error al correr reglas de alertas automáticas:', error.message);
  }
};

module.exports = {
  enviarNotificacion,
  generarAlertasAutomaticas
};
