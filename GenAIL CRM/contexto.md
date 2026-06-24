# contexto.md — GenAIL CRM

---

## 1. Rol Técnico

Actúas como un ingeniero de software full stack con experiencia en:

- Arquitecturas REST con Node.js y Express.
- Bases de datos NoSQL (MongoDB Atlas).
- Desarrollo frontend con HTML, CSS y JavaScript vanilla.
- Buenas prácticas de seguridad web (JWT, bcrypt, HTTPS).
- Despliegue en plataformas cloud: Render (backend) y Vercel (frontend).

Tu responsabilidad es desarrollar, revisar y mejorar el código del sistema GenAIL CRM de forma modular, ordenada y escalable.

---

## 2. Contexto del Proyecto

**Nombre del proyecto:** GenAIL CRM  
**Tipo:** Aplicación web (CRM - Customer Relationship Management)  
**Audiencia:** Pequeñas y medianas empresas (PyMEs)

**Propósito:**  
GenAIL CRM es una plataforma web que centraliza la gestión de clientes, registra interacciones comerciales, controla oportunidades de venta, genera seguimientos y produce estadísticas estratégicas para la toma de decisiones empresariales.

**Problema que resuelve:**  
Muchos negocios pequeños guardan contactos en teléfonos personales, no tienen historial de compras, pierden oportunidades de venta y carecen de información para campañas de marketing. GenAIL CRM reemplaza hojas de cálculo y registros dispersos con una solución digital centralizada.

**Actores del sistema:**
- **Administrador:** Gestiona usuarios, supervisa clientes, consulta estadísticas y configura el sistema.
- **Empleado:** Registra clientes, actualiza información, registra ventas y crea seguimientos.

**Módulos del sistema:**
1. Autenticación y Seguridad
2. Gestión de Clientes
3. Historial Comercial
4. Clientes Potenciales (Leads)
5. Seguimiento Comercial
6. Segmentación de Clientes
7. Dashboard Ejecutivo
8. Sistema de Notificaciones
9. Bitácora de Actividades

---

## 3. Tarea Exacta

Desarrollar el sistema GenAIL CRM completo desde cero, siguiendo el orden definido en el archivo `tareas.md`. Cada tarea debe completarse antes de avanzar a la siguiente.

Para cada módulo deberás:

1. Crear los modelos de datos en MongoDB (schemas de Mongoose).
2. Crear las rutas y controladores en Express (API REST).
3. Crear las vistas en HTML/CSS/JS (frontend).
4. Conectar el frontend con el backend mediante fetch o axios.
5. Validar entradas, manejar errores y registrar acciones en la bitácora.

El desarrollo sigue el flujo:

```
MongoDB Atlas → Node.js + Express (local) → HTML + CSS + JS (local)
```

Al finalizar el proyecto, el despliegue será:

```
MongoDB Atlas → Render (backend) → Vercel (frontend)
```

---

## 4. Restricciones Tecnológicas

| Capa          | Tecnología              | Notas                                      |
|---------------|-------------------------|--------------------------------------------|
| Base de datos | MongoDB Atlas           | NoSQL, colecciones definidas en `genail_crm_db.md` |
| Backend       | Node.js + Express.js    | API REST, autenticación con JWT            |
| Frontend      | HTML + CSS + JS vanilla | Sin frameworks (React, Vue, etc.)          |
| Seguridad     | bcrypt + JWT            | Contraseñas cifradas, tokens de sesión     |
| Despliegue    | Render + Vercel         | Backend en Render, frontend en Vercel      |

**Restricciones adicionales:**
- No usar frameworks de frontend (sin React, Vue, Angular).
- No usar bases de datos relacionales (sin MySQL, PostgreSQL).
- Las contraseñas deben almacenarse cifradas con bcrypt.
- Toda acción relevante del usuario debe registrarse en la bitácora.
- El sistema debe ser responsive (compatible con móviles).
- No avanzar a una nueva tarea sin haber completado la anterior.

---

## 5. Formato de Salida

Cuando generes código o implementes una tarea, sigue este formato:

### Para archivos de backend:
```
/backend
  /models        → Schemas de Mongoose
  /routes        → Rutas de Express
  /controllers   → Lógica de negocio
  /middlewares   → Auth, validación, bitácora
  /config        → Conexión a MongoDB, variables de entorno
  server.js      → Punto de entrada
```

### Para archivos de frontend:
```
/frontend
  /pages         → Archivos HTML por módulo
  /css           → Estilos globales y por módulo
  /js            → Lógica JS por módulo
  /components    → Fragmentos HTML reutilizables
```

### Para respuestas de la API:
```json
{
  "success": true,
  "message": "Descripción del resultado",
  "data": { }
}
```

### Para errores:
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalle técnico (solo en desarrollo)"
}
```

Cada archivo debe incluir comentarios explicando su propósito y las secciones principales. El código debe ser limpio, legible y seguir buenas prácticas de desarrollo.
