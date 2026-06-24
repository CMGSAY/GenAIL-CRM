// ============================================
// GenAIL CRM — Modelo de Cliente
// Archivo: /backend/models/Cliente.js
// Propósito: Definición del esquema de Mongoose para Clientes
// ============================================

const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son obligatorios'],
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  correo: {
    type: String,
    lowercase: true,
    trim: true,
    // sparse: true permite indexar valores nulos de forma única, 
    // es decir, varios registros pueden tener correo vacío/null.
    unique: true,
    sparse: true
  },
  direccion: {
    type: String,
    trim: true
  },
  empresa: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  categoria: {
    type: String,
    enum: ['premium', 'frecuente', 'potencial', 'inactivo'],
    default: 'potencial'
  },
  totalCompras: {
    type: Number,
    default: 0
  },
  cantidadCompras: {
    type: Number,
    default: 0
  },
  ultimaActividad: {
    type: Date,
    default: Date.now
  },
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índice compuesto para búsqueda de texto completo rápida
ClienteSchema.index({ nombre: 'text', apellidos: 'text', empresa: 'text' });

module.exports = mongoose.model('Cliente', ClienteSchema);
