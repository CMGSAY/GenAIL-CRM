// ============================================
// GenAIL CRM — Modelo de Notificación
// Archivo: /backend/models/Notificacion.js
// Propósito: Definición del esquema de Mongoose para Alertas del Sistema
// ============================================

const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID de usuario es obligatorio']
  },
  tipo: {
    type: String,
    enum: [
      'seguimiento_pendiente',
      'cliente_sin_contacto',
      'oportunidad_por_vencer',
      'nuevo_lead',
      'otro'
    ],
    required: true
  },
  mensaje: {
    type: String,
    required: true,
    trim: true
  },
  referenciaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenciaTipo: {
    type: String,
    enum: ['Cliente', 'Lead', 'Seguimiento', 'Compra', 'Usuario', 'Otro'],
    required: false
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaExpiracion: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Índices requeridos
NotificacionSchema.index({ usuarioId: 1, leida: 1 });
NotificacionSchema.index({ createdAt: -1 });

// TTL Index: Mongoose configurará el índice para expirar a las 0 segundos de la fecha establecida
NotificacionSchema.index({ fechaExpiracion: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notificacion', NotificacionSchema);
