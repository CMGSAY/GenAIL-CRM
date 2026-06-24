// ============================================
// GenAIL CRM — Modelo de Lead (Clientes Potenciales)
// Archivo: /backend/models/Lead.js
// Propósito: Definición del esquema de Mongoose para Leads
// ============================================

const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El ID de cliente es obligatorio']
  },
  productoInteres: {
    type: String,
    required: [true, 'El producto o servicio de interés es obligatorio'],
    trim: true
  },
  nivelInteres: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    default: 'medio'
  },
  estado: {
    type: String,
    enum: ['nuevo', 'contactado', 'en_negociacion', 'ganado', 'perdido'],
    default: 'nuevo'
  },
  fechaContacto: {
    type: Date,
    default: Date.now
  },
  fechaCierre: {
    type: Date
  },
  valorEstimado: {
    type: Number,
    min: [0, 'El valor estimado no puede ser negativo'],
    default: 0
  },
  notas: {
    type: String,
    trim: true
  },
  asignadoA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario asignado es obligatorio']
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índices requeridos
LeadSchema.index({ clienteId: 1 });
LeadSchema.index({ estado: 1 });
LeadSchema.index({ asignadoA: 1 });
LeadSchema.index({ asignadoA: 1, estado: 1 });
LeadSchema.index({ fechaCierre: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
