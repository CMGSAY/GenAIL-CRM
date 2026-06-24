# genail_crm_db.md — Diseño de Base de Datos NoSQL
## GenAIL CRM — MongoDB Atlas

> Arquitecto: IA como experto en MongoDB  
> Stack: Node.js + Express + MongoDB Atlas  
> Objetivo: Base de datos escalable para CRM con gestión de clientes, historial de compras, usuarios con roles, seguimientos comerciales y bitácora de actividades.

---

## Decisiones Arquitectónicas Generales

| Decisión | Justificación |
|---|---|
| MongoDB Atlas | Base de datos NoSQL en la nube, escalable, sin gestión de servidores, compatible con Mongoose |
| Documentos embebidos vs referencias | Se usa referencia (ObjectId) cuando la entidad tiene vida propia y puede crecer. Se usa embedding cuando el dato es pequeño y siempre se consulta junto al padre |
| Índices | Se definen en los campos más consultados para garantizar respuestas < 3 segundos |
| Soft delete | Los registros no se eliminan físicamente. Se usa un campo `estado: "activo" / "inactivo"` para preservar integridad referencial |
| Timestamps | Todas las colecciones incluyen `createdAt` y `updatedAt` gestionados por Mongoose (`timestamps: true`) |

---

## Colecciones

### 1. `usuarios`

Almacena los usuarios del sistema con sus roles y credenciales.

```javascript
{
  _id: ObjectId,
  nombre: String,           // Nombre completo del usuario
  correo: String,           // Correo único (índice único)
  contraseña: String,       // Hash bcrypt
  rol: {
    type: String,
    enum: ["administrador", "empleado"],
    default: "empleado"
  },
  estado: {
    type: String,
    enum: ["activo", "inactivo"],
    default: "activo"
  },
  ultimoAcceso: Date,       // Fecha del último login
  createdAt: Date,          // Mongoose timestamp
  updatedAt: Date           // Mongoose timestamp
}
```

**Índices:**
```javascript
{ correo: 1 }           // unique: true — búsqueda rápida en login
{ rol: 1 }              // filtro por rol en gestión de usuarios
{ estado: 1 }           // filtro de usuarios activos
```

**Justificación:** Colección separada para gestión de acceso. El campo `rol` controla qué endpoints puede consumir cada usuario. La contraseña nunca se devuelve en las respuestas de la API (se excluye con `.select('-contraseña')`).

---

### 2. `clientes`

Almacena la información de los clientes de la empresa.

```javascript
{
  _id: ObjectId,
  nombre: String,           // Requerido
  apellidos: String,        // Requerido
  telefono: String,
  correo: String,           // Índice único (puede ser null si tiene teléfono)
  direccion: String,
  empresa: String,
  estado: {
    type: String,
    enum: ["activo", "inactivo"],
    default: "activo"
  },
  categoria: {
    type: String,
    enum: ["premium", "frecuente", "potencial", "inactivo"],
    default: "potencial"
  },
  // Segmentación calculada automáticamente
  totalCompras: { type: Number, default: 0 },       // Monto total acumulado
  cantidadCompras: { type: Number, default: 0 },    // Número de compras realizadas
  ultimaActividad: Date,                             // Fecha de última interacción
  registradoPor: {
    type: ObjectId,
    ref: "Usuario"
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ correo: 1 }             // unique: true, sparse: true (permite null)
{ estado: 1 }             // filtro de clientes activos
{ categoria: 1 }          // filtro por segmento
{ nombre: "text", apellidos: "text", empresa: "text" }  // búsqueda de texto completo
{ registradoPor: 1 }      // clientes por empleado
{ ultimaActividad: 1 }    // detectar clientes inactivos
```

**Justificación:** Los campos `totalCompras`, `cantidadCompras` y `ultimaActividad` se actualizan como contadores desnormalizados cada vez que se registra una compra o actividad. Esto evita aggregations costosas al segmentar clientes y garantiza respuestas rápidas en el dashboard.

---

### 3. `compras`

Historial de compras asociado a cada cliente.

```javascript
{
  _id: ObjectId,
  clienteId: {
    type: ObjectId,
    ref: "Cliente",
    required: true
  },
  productos: [
    {
      nombre: String,         // Nombre del producto o servicio
      cantidad: Number,
      precioUnitario: Number,
      subtotal: Number
    }
  ],
  montoTotal: Number,         // Suma de todos los subtotales
  fecha: Date,                // Fecha de la compra
  observaciones: String,
  registradoPor: {
    type: ObjectId,
    ref: "Usuario"
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ clienteId: 1 }              // consultas de historial por cliente (más frecuente)
{ fecha: -1 }                 // ordenar por fecha descendente
{ clienteId: 1, fecha: -1 }   // índice compuesto: historial de un cliente ordenado
{ registradoPor: 1 }          // ventas por empleado
```

**Justificación:** Los productos se almacenan como array embebido porque son datos históricos inmutables (no cambian después de registrar la compra). Se usa referencia a `Cliente` porque las compras tienen vida propia y se consultan de forma independiente. El índice compuesto `{clienteId, fecha}` es el más importante ya que soporta la consulta más frecuente del sistema.

---

### 4. `leads`

Oportunidades de venta (clientes potenciales en proceso de negociación).

```javascript
{
  _id: ObjectId,
  clienteId: {
    type: ObjectId,
    ref: "Cliente",
    required: true
  },
  productoInteres: String,      // Producto o servicio de interés
  nivelInteres: {
    type: String,
    enum: ["bajo", "medio", "alto"],
    default: "medio"
  },
  estado: {
    type: String,
    enum: ["nuevo", "contactado", "en_negociacion", "ganado", "perdido"],
    default: "nuevo"
  },
  fechaContacto: Date,
  fechaCierre: Date,            // Fecha estimada o real de cierre
  valorEstimado: Number,        // Monto potencial de la oportunidad
  notas: String,
  asignadoA: {
    type: ObjectId,
    ref: "Usuario"
  },
  creadoPor: {
    type: ObjectId,
    ref: "Usuario"
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ clienteId: 1 }              // leads de un cliente específico
{ estado: 1 }                 // filtro por estado del embudo de ventas
{ asignadoA: 1 }              // leads asignados a un empleado
{ asignadoA: 1, estado: 1 }   // índice compuesto: leads de un empleado por estado
{ fechaCierre: 1 }            // detectar oportunidades próximas a vencer
```

**Justificación:** La colección `leads` es separada de `clientes` porque un cliente puede tener múltiples oportunidades simultáneas en distintos estados. El campo `estado` permite construir un embudo de ventas (pipeline) visual. El índice `{asignadoA, estado}` soporta la vista más común de un empleado: "mis leads pendientes".

---

### 5. `seguimientos`

Registro de todas las actividades de contacto con clientes.

```javascript
{
  _id: ObjectId,
  clienteId: {
    type: ObjectId,
    ref: "Cliente",
    required: true
  },
  tipo: {
    type: String,
    enum: ["llamada", "visita", "mensaje", "correo", "reunion", "otro"]
  },
  descripcion: String,          // Detalle de la actividad realizada
  fecha: Date,                  // Fecha en que se realizó
  proximaAccion: String,        // Descripción de la siguiente acción
  fechaProxima: Date,           // Fecha programada para la próxima acción
  completado: {
    type: Boolean,
    default: false
  },
  realizadoPor: {
    type: ObjectId,
    ref: "Usuario"
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ clienteId: 1 }                        // seguimientos de un cliente
{ realizadoPor: 1 }                     // seguimientos por empleado
{ completado: 1, fechaProxima: 1 }      // índice compuesto: seguimientos pendientes ordenados por fecha
{ fechaProxima: 1 }                     // detectar recordatorios próximos a vencer
```

**Justificación:** El índice compuesto `{completado, fechaProxima}` es crítico para el sistema de notificaciones: permite consultar en milisegundos todos los seguimientos incompletos cuya `fechaProxima` ya pasó o está próxima. Separar esta colección de `clientes` permite escalar el historial de actividades sin afectar el rendimiento de las consultas de clientes.

---

### 6. `notificaciones`

Alertas generadas automáticamente para los usuarios del sistema.

```javascript
{
  _id: ObjectId,
  usuarioId: {
    type: ObjectId,
    ref: "Usuario",
    required: true
  },
  tipo: {
    type: String,
    enum: [
      "seguimiento_pendiente",
      "cliente_sin_contacto",
      "oportunidad_por_vencer",
      "nuevo_lead",
      "otro"
    ]
  },
  mensaje: String,              // Texto legible de la notificación
  referenciaId: ObjectId,       // ID del documento relacionado (cliente, lead, seguimiento)
  referenciaTipo: String,       // Colección a la que pertenece referenciaId
  leida: {
    type: Boolean,
    default: false
  },
  fechaExpiracion: Date,        // Fecha en que la notificación deja de ser relevante
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ usuarioId: 1, leida: 1 }      // notificaciones no leídas de un usuario (consulta más frecuente)
{ createdAt: -1 }               // ordenar por más recientes
{ fechaExpiracion: 1 }          // TTL index: eliminar notificaciones expiradas automáticamente
```

**Justificación:** El índice `{usuarioId, leida}` es el más consultado (se ejecuta en cada carga del header para mostrar el contador). El índice TTL sobre `fechaExpiracion` permite que MongoDB elimine automáticamente notificaciones antiguas sin necesidad de un job manual, manteniendo la colección liviana.

---

### 7. `bitacora`

Registro inmutable de todas las acciones realizadas en el sistema.

```javascript
{
  _id: ObjectId,
  usuarioId: {
    type: ObjectId,
    ref: "Usuario"
  },
  nombreUsuario: String,        // Desnormalizado: para consultar sin join aunque el usuario sea eliminado
  accion: String,               // Ej: "CREAR_CLIENTE", "EDITAR_LEAD", "LOGIN", "LOGOUT"
  modulo: {
    type: String,
    enum: ["autenticacion", "clientes", "compras", "leads", "seguimientos", "usuarios", "dashboard", "sistema"]
  },
  descripcion: String,          // Texto legible: "Creó el cliente Juan Pérez"
  documentoId: ObjectId,        // ID del documento afectado (si aplica)
  ip: String,                   // Dirección IP del cliente
  userAgent: String,            // Navegador/dispositivo (opcional)
  fecha: Date,                  // Fecha de la acción
  hora: String,                 // Hora formateada "HH:MM AM/PM"
  createdAt: Date
}
```

**Índices:**
```javascript
{ usuarioId: 1, createdAt: -1 }   // bitácora de un usuario ordenada por fecha
{ modulo: 1, createdAt: -1 }      // bitácora por módulo
{ accion: 1 }                     // filtro por tipo de acción
{ createdAt: -1 }                 // listado general más reciente primero
```

**Justificación:** La bitácora es de solo escritura (nunca se edita ni elimina un registro). El campo `nombreUsuario` se desnormaliza para garantizar que el registro histórico sea fiel incluso si el usuario es desactivado o renombrado. Esta colección puede crecer significativamente, por lo que en el futuro puede configurarse un TTL de 1 año o mover registros antiguos a cold storage.

---

## Resumen de Colecciones

| Colección | Documentos estimados (1 año) | Función principal |
|---|---|---|
| `usuarios` | < 50 | Control de acceso y roles |
| `clientes` | 500 – 5,000 | Información centralizada de clientes |
| `compras` | 2,000 – 20,000 | Historial comercial |
| `leads` | 500 – 5,000 | Embudo de ventas |
| `seguimientos` | 2,000 – 20,000 | Actividades de contacto |
| `notificaciones` | 200 – 2,000 | Alertas del sistema |
| `bitacora` | 10,000 – 100,000 | Auditoría de acciones |

---

## Relaciones Entre Colecciones

```
usuarios ──────────────────────────────────────────────┐
    │                                                   │
    │ registradoPor / realizadoPor / asignadoA          │
    ▼                                                   │
clientes ────────────────────────────────────────────  │
    │           │           │                           │
    │clienteId  │clienteId  │clienteId                  │
    ▼           ▼           ▼                           │
 compras      leads    seguimientos                     │
                                                        │
notificaciones ◄── usuarioId ───────────────────────── ┘
bitacora       ◄── usuarioId ───────────────────────── ┘
```

---

## Configuración en Mongoose (Node.js)

```javascript
// /backend/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'genail_crm'
    });
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Variable de entorno requerida en `.env`:**
```
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/genail_crm
```

---

## Estrategia de Escalabilidad Futura

| Escenario | Acción recomendada |
|---|---|
| +10,000 clientes | Añadir paginación con `skip/limit` o cursor-based pagination |
| +100,000 registros de bitácora | Configurar TTL index de 365 días o habilitar Atlas Archive |
| Múltiples empresas (SaaS) | Añadir campo `empresaId` a todas las colecciones y crear índice compuesto |
| Búsqueda avanzada de clientes | Activar Atlas Search (índice full-text de MongoDB Atlas) |
| Dashboard con muchos datos | Usar MongoDB Aggregation Pipeline con `$facet` para consultas en paralelo |
