// ============================================
// GenAIL CRM — Modelo de Usuario
// Archivo: /backend/models/Usuario.js
// Propósito: Definición del esquema de Mongoose para Usuarios
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  rol: {
    type: String,
    enum: ['administrador', 'empleado'],
    default: 'empleado'
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  ultimoAcceso: {
    type: Date
  },
  restablecerContraseñaToken: String,
  restablecerContraseñaExpiracion: Date
}, {
  timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Hook de Mongoose para cifrar la contraseña antes de guardar
UsuarioSchema.pre('save', async function() {
  // Solo cifrar si la contraseña ha sido modificada (o es nueva)
  if (!this.isModified('contraseña')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

// Método para verificar la contraseña ingresada con la contraseña cifrada
UsuarioSchema.methods.compararContraseña = async function(contraseñaIngresada) {
  return await bcrypt.compare(contraseñaIngresada, this.contraseña);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
