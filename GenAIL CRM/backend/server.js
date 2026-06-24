// ============================================
// GenAIL CRM — Servidor Principal
// Archivo: /backend/server.js
// Propósito: Punto de entrada de la aplicación Express
// ============================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// --- Cargar variables de entorno ---
dotenv.config();

// --- Crear aplicación Express ---
const app = express();

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Parsear JSON en el body de las peticiones
app.use(express.json());

// Parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// CORS — Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger de peticiones HTTP (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Servir archivos estáticos del frontend (para desarrollo local)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================
// RUTAS DE LA API
// ============================================

// Registro del módulo de autenticación
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clientes', require('./routes/clienteRoutes'));
app.use('/api/compras', require('./routes/compraRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/seguimientos', require('./routes/seguimientoRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notificaciones', require('./routes/notificacionRoutes'));
app.use('/api/bitacora', require('./routes/bitacoraRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));

// Ruta de verificación de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GenAIL CRM API funcionando correctamente',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

// --- Aquí se registrarán las rutas de cada módulo ---
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/clientes', require('./routes/clienteRoutes'));
// app.use('/api/compras', require('./routes/compraRoutes'));
// app.use('/api/leads', require('./routes/leadRoutes'));
// app.use('/api/seguimientos', require('./routes/seguimientoRoutes'));
// app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// app.use('/api/notificaciones', require('./routes/notificacionRoutes'));
// app.use('/api/bitacora', require('./routes/bitacoraRoutes'));
// app.use('/api/usuarios', require('./routes/usuarioRoutes'));

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================

app.use('/api/{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ============================================
// MANEJADOR GLOBAL DE ERRORES
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Conectar a MongoDB Atlas
    await connectDB();

    // Iniciar el servidor HTTP
    app.listen(PORT, () => {
      console.log(`🚀 GenAIL CRM API corriendo en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
