// ============================================
// GenAIL CRM — Modelo de Bitácora
// Archivo: /backend/models/Bitacora.js
// Propósito: Definición del esquema de Mongoose para la Bitácora
// ============================================

const mongoose = require('mongoose');

const BitacoraSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false // Puede ser null si es una acción sin login (intento de login fallido)
  },
  nombreUsuario: {
    type: String,
    required: true,
    default: 'Sistema/Invitado'
  },
  accion: {
    type: String,
    required: true // Ej: "LOGIN", "LOGOUT", "CREAR_CLIENTE", etc.
  },
  modulo: {
    type: String,
    enum: ['autenticacion', 'clientes', 'compras', 'leads', 'seguimientos', 'usuarios', 'dashboard', 'sistema'],
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  documentoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  hora: {
    type: String,
    required: true // HH:MM AM/PM
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Solo necesitamos saber cuándo se creó
});

module.exports = mongoose.model('Bitacora', BitacoraSchema);
