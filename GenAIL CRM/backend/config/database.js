// ============================================
// GenAIL CRM — Configuración de Base de Datos
// Archivo: /backend/config/database.js
// Propósito: Conexión a MongoDB Atlas con Mongoose
// ============================================

const mongoose = require('mongoose');

/**
 * Conecta a MongoDB Atlas usando la URI definida en las variables de entorno.
 * Mongoose 7+ no requiere useNewUrlParser ni useUnifiedTopology.
 * La reconexión automática es manejada internamente por Mongoose.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
