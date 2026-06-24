// ============================================
// GenAIL CRM — Modelo de Compra
// Archivo: /backend/models/Compra.js
// Propósito: Definición del esquema de Mongoose para Compras
// ============================================

const mongoose = require('mongoose');

const ProductoEmbebidoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  cantidad: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad mínima es 1']
  },
  precioUnitario: {
    type: Number,
    required: [true, 'El precio unitario es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false }); // No necesitamos ID para los productos embebidos

const CompraSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El ID de cliente es obligatorio']
  },
  productos: [ProductoEmbebidoSchema],
  montoTotal: {
    type: Number,
    required: true,
    default: 0
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  observaciones: {
    type: String,
    trim: true
  },
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índice compuesto: Historial de un cliente ordenado por fecha descendente
CompraSchema.index({ clienteId: 1, fecha: -1 });

module.exports = mongoose.model('Compra', CompraSchema);
