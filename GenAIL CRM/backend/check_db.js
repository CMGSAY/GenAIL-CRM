// Helper para verificar la base de datos
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Usuario = require('./models/Usuario');
const Bitacora = require('./models/Bitacora');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    const users = await Usuario.find({});
    console.log("\n👤 USUARIOS EN EL SISTEMA:");
    console.log(users.map(u => ({ id: u._id, nombre: u.nombre, correo: u.correo, rol: u.rol })));

    const logs = await Bitacora.find({}).sort({ createdAt: -1 }).limit(5);
    console.log("\n📜 ÚLTIMOS 5 REGISTROS DE BITÁCORA:");
    console.log(logs.map(l => ({ accion: l.accion, modulo: l.modulo, desc: l.descripcion, user: l.nombreUsuario, hora: l.hora })));

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
};

run();
