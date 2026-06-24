// Test user management and bitacora logging locally
const runTests = async () => {
  try {
    // 1. LOGIN AS ADMIN
    const adminLoginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "carlos@crm.com", contraseña: "password123" })
    });
    const adminLoginJson = await adminLoginRes.json();
    const adminToken = adminLoginJson.data.token;
    console.log("🔑 LOGGED IN AS ADMIN");

    // 2. CREATE A NEW EMPLOYEE USER
    console.log("\n👥 CREATING NEW EMPLOYEE...");
    const empPayload = {
      nombre: "Alicia Salazar",
      correo: "alicia@crm.com",
      contraseña: "password456",
      rol: "empleado"
    };

    // Clean up if already exists to prevent duplicate emails
    const cleanRes = await fetch("http://localhost:5000/api/usuarios", {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const cleanJson = await cleanRes.json();
    const existingAlicia = cleanJson.data?.usuarios?.find(u => u.correo === "alicia@crm.com");
    
    if (existingAlicia) {
      console.log(`Alicia already exists. ID: ${existingAlicia._id}. Editing/re-saving...`);
    } else {
      const createRes = await fetch("http://localhost:5000/api/usuarios", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify(empPayload)
      });
      console.log("EMPLOYEE CREATE RESPONSE:", await createRes.json());
    }

    // 3. LOGIN AS ALICIA (EMPLOYEE)
    console.log("\n🔑 LOGGING IN AS EMPLOYEE (ALICIA)...");
    const empLoginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "alicia@crm.com", contraseña: "password456" })
    });
    const empLoginJson = await empLoginRes.json();
    const empToken = empLoginJson.data.token;
    console.log("🔑 LOGGED IN AS EMPLOYEE");

    // 4. TEST EMPLOYEE CANNOT ACCESS DASHBOARD (Should return 403 Forbidden)
    console.log("\n🔒 TESTING EMPLOYEE ACCESS TO DASHBOARD KPIs...");
    const dashRes = await fetch("http://localhost:5000/api/dashboard/indicadores", {
      headers: { "Authorization": `Bearer ${empToken}` }
    });
    console.log("DASHBOARD RESPONSE (Should be 403):", dashRes.status, await dashRes.json());

    // 5. TEST EMPLOYEE CANNOT ACCESS USERS LIST (Should return 403 Forbidden)
    console.log("\n🔒 TESTING EMPLOYEE ACCESS TO USER MANAGEMENT...");
    const usrRes = await fetch("http://localhost:5000/api/usuarios", {
      headers: { "Authorization": `Bearer ${empToken}` }
    });
    console.log("USER MANAGEMENT RESPONSE (Should be 403):", usrRes.status, await usrRes.json());

    // 6. FETCH AUDIT LOGS AS ADMIN TO VERIFY ENTRIES
    console.log("\n📜 FETCHING AUDIT LOGS AS ADMIN...");
    const bitacoraRes = await fetch("http://localhost:5000/api/bitacora?limit=5", {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const bitacoraJson = await bitacoraRes.json();
    console.log("LATEST BITACORA LOGS:", bitacoraJson.data.registros.map(r => ({
      accion: r.accion,
      modulo: r.modulo,
      desc: r.descripcion,
      usuario: r.nombreUsuario
    })));

  } catch (err) {
    console.error("TEST FAILED:", err);
  }
};

runTests();
