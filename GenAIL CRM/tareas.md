# tareas.md — GenAIL CRM
> Lista de tareas ordenadas de forma lógica y secuencial.  
> Marcar con `- [x]` al completar cada tarea antes de avanzar a la siguiente.

---

## FASE 1: Configuración del Entorno

- [ ] 1.1 Crear la estructura de carpetas del proyecto (`/backend`, `/frontend`)
- [ ] 1.2 Inicializar el proyecto Node.js (`npm init`)
- [ ] 1.3 Instalar dependencias del backend: `express`, `mongoose`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `cors`, `morgan`
- [ ] 1.4 Crear el archivo `.env` con las variables de entorno (URI de MongoDB, puerto, clave JWT)
- [ ] 1.5 Crear el archivo `.gitignore` (excluir `node_modules`, `.env`)
- [ ] 1.6 Configurar la conexión a MongoDB Atlas en `/backend/config/database.js`
- [ ] 1.7 Crear el servidor principal `server.js` y verificar que inicia correctamente
- [ ] 1.8 Verificar conexión exitosa a MongoDB Atlas desde consola

---

## FASE 2: Módulo de Autenticación y Seguridad

- [ ] 2.1 Crear el modelo `Usuario` en `/backend/models/Usuario.js` (nombre, correo, contraseña, rol, estado, fechaRegistro)
- [ ] 2.2 Crear el middleware de autenticación JWT en `/backend/middlewares/authMiddleware.js`
- [ ] 2.3 Crear el middleware de autorización por roles en `/backend/middlewares/rolMiddleware.js`
- [ ] 2.4 Crear el controlador de autenticación en `/backend/controllers/authController.js` (registro, login, recuperación)
- [ ] 2.5 Crear las rutas de autenticación en `/backend/routes/authRoutes.js`
- [ ] 2.6 Registrar rutas en `server.js`
- [ ] 2.7 Crear la página de login en `/frontend/pages/login.html`
- [ ] 2.8 Crear los estilos del login en `/frontend/css/login.css`
- [ ] 2.9 Crear la lógica JS del login en `/frontend/js/login.js` (fetch al backend, manejo de token JWT)
- [ ] 2.10 Probar login con usuario administrador desde el frontend

---

## FASE 3: Módulo de Gestión de Clientes

- [ ] 3.1 Crear el modelo `Cliente` en `/backend/models/Cliente.js` (nombre, apellidos, teléfono, correo, dirección, empresa, estado, fechaRegistro, registradoPor)
- [ ] 3.2 Crear el controlador de clientes en `/backend/controllers/clienteController.js` (CRUD completo)
- [ ] 3.3 Crear las rutas de clientes en `/backend/routes/clienteRoutes.js` (protegidas con JWT)
- [ ] 3.4 Crear la página de listado de clientes `/frontend/pages/clientes.html`
- [ ] 3.5 Crear el formulario de registro/edición de clientes `/frontend/pages/cliente-form.html`
- [ ] 3.6 Crear la lógica JS de clientes en `/frontend/js/clientes.js` (listar, buscar, filtrar, crear, editar, desactivar)
- [ ] 3.7 Implementar validaciones: correo único, al menos un medio de contacto
- [ ] 3.8 Probar CRUD completo de clientes desde el frontend

---

## FASE 4: Módulo de Historial Comercial

- [ ] 4.1 Crear el modelo `Compra` en `/backend/models/Compra.js` (clienteId, productos, monto, fecha, observaciones, registradoPor)
- [ ] 4.2 Crear el controlador de compras en `/backend/controllers/compraController.js`
- [ ] 4.3 Crear las rutas de compras en `/backend/routes/compraRoutes.js` (protegidas con JWT)
- [ ] 4.4 Crear la página de historial de compras `/frontend/pages/historial.html`
- [ ] 4.5 Crear la lógica JS del historial en `/frontend/js/historial.js` (listar por cliente, visualizar frecuencia)
- [ ] 4.6 Probar registro y consulta de historial de compras desde el frontend

---

## FASE 5: Módulo de Clientes Potenciales (Leads)

- [ ] 5.1 Crear el modelo `Lead` en `/backend/models/Lead.js` (clienteId, productoInteres, nivelInteres, fechaContacto, estado, notas, asignadoA)
- [ ] 5.2 Crear el controlador de leads en `/backend/controllers/leadController.js`
- [ ] 5.3 Crear las rutas de leads en `/backend/routes/leadRoutes.js` (protegidas con JWT)
- [ ] 5.4 Crear la página de leads `/frontend/pages/leads.html`
- [ ] 5.5 Crear la lógica JS de leads en `/frontend/js/leads.js` (listar, filtrar por estado, cambiar estado)
- [ ] 5.6 Implementar los estados: Nuevo, Contactado, En negociación, Ganado, Perdido
- [ ] 5.7 Probar flujo completo de leads desde el frontend

---

## FASE 6: Módulo de Seguimiento Comercial

- [ ] 6.1 Crear el modelo `Seguimiento` en `/backend/models/Seguimiento.js` (clienteId, tipo, descripción, fecha, proximaAccion, fechaProxima, realizadoPor)
- [ ] 6.2 Crear el controlador de seguimientos en `/backend/controllers/seguimientoController.js`
- [ ] 6.3 Crear las rutas de seguimientos en `/backend/routes/seguimientoRoutes.js` (protegidas con JWT)
- [ ] 6.4 Crear la página de seguimientos `/frontend/pages/seguimientos.html`
- [ ] 6.5 Crear la lógica JS de seguimientos en `/frontend/js/seguimientos.js` (registrar actividad, crear recordatorio)
- [ ] 6.6 Probar registro y consulta de seguimientos desde el frontend

---

## FASE 7: Módulo de Segmentación de Clientes

- [ ] 7.1 Crear la lógica de segmentación en `/backend/services/segmentacionService.js`
- [ ] 7.2 Implementar las categorías: Premium (>Q10,000), Frecuente (>5 compras), Potencial (sin compras), Inactivo (>180 días)
- [ ] 7.3 Crear endpoint para obtener clientes por categoría en el controlador de clientes
- [ ] 7.4 Mostrar categoría del cliente en la vista de detalle del cliente
- [ ] 7.5 Probar que la segmentación automática funciona correctamente

---

## FASE 8: Dashboard Ejecutivo

- [ ] 8.1 Crear el controlador de estadísticas en `/backend/controllers/dashboardController.js`
- [ ] 8.2 Crear las rutas del dashboard en `/backend/routes/dashboardRoutes.js` (solo administrador)
- [ ] 8.3 Implementar los indicadores: total clientes, clientes nuevos, potenciales, inactivos, ventas registradas, seguimientos pendientes
- [ ] 8.4 Crear la página del dashboard `/frontend/pages/dashboard.html`
- [ ] 8.5 Crear la lógica JS del dashboard en `/frontend/js/dashboard.js`
- [ ] 8.6 Integrar gráficas (Chart.js u otra librería CDN): clientes por categoría, ventas mensuales, crecimiento de clientes
- [ ] 8.7 Probar que el dashboard muestra información correcta y actualizada

---

## FASE 9: Sistema de Notificaciones

- [ ] 9.1 Crear el modelo `Notificacion` en `/backend/models/Notificacion.js` (usuarioId, tipo, mensaje, leida, fecha)
- [ ] 9.2 Crear la lógica de generación de notificaciones en `/backend/services/notificacionService.js`
- [ ] 9.3 Crear las reglas de alerta: seguimiento pendiente, cliente importante sin contacto, oportunidad próxima a vencer
- [ ] 9.4 Crear las rutas de notificaciones en `/backend/routes/notificacionRoutes.js`
- [ ] 9.5 Mostrar notificaciones en el header del frontend (contador + listado)
- [ ] 9.6 Implementar marcar notificación como leída
- [ ] 9.7 Probar que las notificaciones se generan y muestran correctamente

---

## FASE 10: Bitácora de Actividades

- [ ] 10.1 Crear el modelo `Bitacora` en `/backend/models/Bitacora.js` (usuarioId, accion, descripcion, modulo, fecha, hora, ip)
- [ ] 10.2 Crear el servicio de bitácora en `/backend/services/bitacoraService.js`
- [ ] 10.3 Integrar el registro automático de bitácora en todos los controladores (crear, editar, eliminar, login, logout)
- [ ] 10.4 Crear las rutas de bitácora en `/backend/routes/bitacoraRoutes.js` (solo administrador)
- [ ] 10.5 Crear la página de bitácora `/frontend/pages/bitacora.html`
- [ ] 10.6 Crear la lógica JS de la bitácora en `/frontend/js/bitacora.js` (listar, filtrar por usuario/fecha/módulo)
- [ ] 10.7 Probar que todas las acciones quedan registradas en la bitácora

---

## FASE 11: Gestión de Usuarios (Administrador)

- [ ] 11.1 Crear el controlador de usuarios en `/backend/controllers/usuarioController.js` (listar, crear, editar, desactivar)
- [ ] 11.2 Crear las rutas de usuarios en `/backend/routes/usuarioRoutes.js` (solo administrador)
- [ ] 11.3 Crear la página de gestión de usuarios `/frontend/pages/usuarios.html`
- [ ] 11.4 Crear la lógica JS de usuarios en `/frontend/js/usuarios.js`
- [ ] 11.5 Probar que el administrador puede gestionar usuarios correctamente

---

## FASE 12: Navegación y Layout General

- [ ] 12.1 Crear el layout general del sistema (sidebar, header, footer) como componente reutilizable
- [ ] 12.2 Crear los estilos globales en `/frontend/css/global.css` (responsive, variables CSS, tipografía)
- [ ] 12.3 Implementar la navegación entre módulos desde el sidebar
- [ ] 12.4 Implementar control de acceso en el frontend: redirigir si no hay token JWT válido
- [ ] 12.5 Implementar cierre de sesión (eliminar token, redirigir a login)
- [ ] 12.6 Verificar que el sistema es responsive en móvil y escritorio

---

## FASE 13: Pruebas y Validaciones Finales

- [ ] 13.1 Probar todos los flujos de usuario como Administrador
- [ ] 13.2 Probar todos los flujos de usuario como Empleado
- [ ] 13.3 Verificar que los roles restringen acceso correctamente
- [ ] 13.4 Verificar que la bitácora registra todas las acciones
- [ ] 13.5 Verificar que las notificaciones se generan correctamente
- [ ] 13.6 Probar la segmentación automática de clientes
- [ ] 13.7 Revisar que no existen errores en consola del navegador ni en el servidor
- [ ] 13.8 Verificar tiempos de respuesta (< 3 segundos por consulta)

---

## FASE 14: Despliegue en Producción

- [ ] 14.1 Preparar variables de entorno para producción
- [ ] 14.2 Configurar CORS en el backend para aceptar el dominio de Vercel
- [ ] 14.3 Desplegar el backend en Render (conectado a MongoDB Atlas)
- [ ] 14.4 Verificar que el backend funciona correctamente en Render
- [ ] 14.5 Actualizar las URLs del backend en el frontend (JS) para apuntar a Render
- [ ] 14.6 Desplegar el frontend en Vercel
- [ ] 14.7 Verificar que el frontend funciona correctamente en Vercel
- [ ] 14.8 Prueba de humo final en producción: login, crear cliente, ver dashboard

---

> **Regla:** No avanzar a la siguiente tarea sin haber completado y verificado la actual.  
> **Total de tareas:** 83
