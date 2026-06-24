// Test notifications rules and endpoints locally in the backend folder
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Seguimiento = require('./models/Seguimiento');
const Cliente = require('./models/Cliente');

const runTests = async () => {
  try {
    // 1. LOGIN
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "carlos@crm.com", contraseña: "password123" })
    });
    const loginJson = await loginRes.json();
    const token = loginJson.data.token;
    console.log("🔑 LOGGED IN");

    // 2. CONNECT DATABASE TO MANIPULATE A RECORD'S DATE
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ DB Connected locally");

    // Find our client Juan
    const client = await Cliente.findOne({ nombre: "Juan" });
    
    // Clean up old follow-ups
    await Seguimiento.deleteMany({ clienteId: client._id, completado: false });

    // Create an overdue follow-up
    const overdueFollow = new Seguimiento({
      clienteId: client._id,
      tipo: "correo",
      descripcion: "Enviar propuesta técnica. Aún pendiente de respuesta.",
      proximaAccion: "Llamar para dar seguimiento al correo técnico",
      fechaProxima: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
      completado: false,
      realizadoPor: new mongoose.Types.ObjectId("6a3b55815217f0f8714b159a")
    });
    await overdueFollow.save();
    console.log(`📞 Overdue follow-up created (ID: ${overdueFollow._id})`);

    await mongoose.disconnect();
    console.log("🔌 DB Disconnected locally");

    // 3. FETCH NOTIFICATIONS (Should trigger rules and generate alert!)
    console.log("\n🔔 FETCHING NOTIFICATIONS TRAYS...");
    const notifRes = await fetch("http://localhost:5000/api/notificaciones", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const notifJson = await notifRes.json();
    const notifs = notifJson.data.notificaciones;
    console.log("NOTIFICATIONS GENERATED:", notifs.map(n => ({
      id: n._id,
      tipo: n.tipo,
      msg: n.mensaje,
      leida: n.leida
    })));

    // 4. CHECK UNREAD COUNT
    const countRes = await fetch("http://localhost:5000/api/notificaciones/count", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const countJson = await countRes.json();
    console.log(`\n🔢 UNREAD COUNT: ${countJson.data.count}`);

    // 5. READ THE NOTIFICATION
    if (notifs.length > 0) {
      const targetId = notifs[0]._id;
      console.log(`\n✓ READING NOTIFICATION (ID: ${targetId})...`);
      const readRes = await fetch(`http://localhost:5000/api/notificaciones/${targetId}/leer`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      console.log("READ RESPONSE:", await readRes.json());

      // 6. CHECK COUNT AGAIN
      const countRes2 = await fetch("http://localhost:5000/api/notificaciones/count", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const countJson2 = await countRes2.json();
      console.log(`\n🔢 NEW UNREAD COUNT: ${countJson2.data.count}`);
    }

  } catch (err) {
    console.error("TEST FAILED:", err);
  }
};

runTests();
