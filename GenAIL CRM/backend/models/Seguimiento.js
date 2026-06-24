// ============================================
// GenAIL CRM — Modelo de Seguimiento
// Archivo: /backend/models/Seguimiento.js
// Propósito: Definición del esquema de Mongoose para Seguimientos
// ============================================

const mongoose = require('mongoose');

const SeguimientoSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El ID de cliente es obligatorio']
  },
  tipo: {
    type: String,
    enum: ['llamada', 'visita', 'mensaje', 'correo', 'reunion', 'otro'],
    required: [true, 'El tipo de interacción es obligatorio']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción de la interacción es obligatoria'],
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  proximaAccion: {
    type: String,
    trim: true
  },
  fechaProxima: {
    type: Date
  },
  completado: {
    type: Boolean,
    default: false
  },
  realizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índices requeridos
SeguimientoSchema.index({ clienteId: 1 });
SeguimientoSchema.index({ realizadoPor: 1 });
SeguimientoSchema.index({ completado: 1, fechaProxima: 1 });
SeguimientoSchema.index({ fechaProxima: 1 });

module.exports = mongoose.model('Seguimiento', SeguimientoSchema);
