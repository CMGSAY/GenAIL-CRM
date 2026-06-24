
**GenAIL CRM**
*Sistema Inteligente de Gestión de Clientes para Pequeñas y Medianas Empresas*

---

# 1. Descripción General del Proyecto

GenAIL CRM es una plataforma web orientada a pequeñas y medianas empresas que permite centralizar la información de clientes, registrar interacciones comerciales, administrar oportunidades de venta, realizar seguimientos y generar estadísticas que ayuden a mejorar la relación con los clientes y aumentar las ventas.

El sistema busca reemplazar el uso de agendas físicas, hojas de cálculo y registros dispersos mediante una solución digital accesible desde cualquier dispositivo con conexión a internet.

---

# 2. Problema de Negocio

Actualmente muchos negocios:

* Guardan contactos en teléfonos personales.
* No tienen historial de compras.
* Pierden oportunidades de venta.
* No realizan seguimiento a clientes interesados.
* No conocen quiénes son sus mejores clientes.
* No cuentan con información para campañas de marketing.

Esto provoca:

* Menores ventas.
* Mala atención al cliente.
* Pérdida de información importante.
* Dificultad para tomar decisiones.

GenAIL CRM busca solucionar estos problemas mediante una plataforma centralizada.

---

# 3. Objetivo General

Desarrollar una aplicación web que permita administrar clientes, registrar actividades comerciales, controlar seguimientos y generar información estratégica para la toma de decisiones empresariales.

---

# 4. Actores del Sistema

## Administrador

Representa al propietario o gerente del negocio.

Responsabilidades:

* Gestionar usuarios.
* Supervisar clientes.
* Consultar estadísticas.
* Configurar el sistema.
* Acceder a toda la información.

---

## Empleado

Representa vendedores o personal de atención.

Responsabilidades:

* Registrar clientes.
* Actualizar información.
* Registrar ventas.
* Crear seguimientos.
* Gestionar clientes asignados.

---

# 5. Módulos del Sistema

---

## Módulo 1: Autenticación y Seguridad

### Funcionalidades

* Inicio de sesión.
* Cierre de sesión.
* Recuperación de contraseña.
* Control de acceso por roles.
* Encriptación de contraseñas.

### Reglas

* Ningún usuario puede acceder sin autenticarse.
* Cada acción debe validarse según el rol.

---

## Módulo 2: Gestión de Clientes

### Funcionalidades

Registrar:

* Nombre
* Apellidos
* Teléfono
* Correo electrónico
* Dirección
* Empresa
* Fecha de registro

Editar información.

Desactivar clientes.

Buscar clientes.

Filtrar clientes.

### Reglas

* No se permiten correos duplicados.
* Debe existir al menos un medio de contacto.

---

## Módulo 3: Historial Comercial

### Funcionalidades

Registrar:

* Productos comprados.
* Fecha de compra.
* Monto.
* Observaciones.

Consultar historial completo.

Visualizar frecuencia de compra.

### Beneficio

Permite conocer hábitos de consumo.

---

## Módulo 4: Clientes Potenciales (Leads)

Esta será una de las características más importantes.

### Funcionalidades

Registrar:

* Cliente interesado.
* Producto de interés.
* Nivel de interés.
* Fecha de contacto.

Estados:

* Nuevo
* Contactado
* En negociación
* Ganado
* Perdido

### Beneficio

Permite controlar oportunidades de venta.

---

## Módulo 5: Seguimiento Comercial

### Funcionalidades

Registrar:

* Llamadas
* Visitas
* Mensajes
* Correos enviados

Crear recordatorios.

Programar próximas acciones.

### Ejemplo

Cliente:

Juan Pérez

Actividad:

Llamada de seguimiento

Próxima acción:

Contactar nuevamente en 5 días.

---

## Módulo 6: Segmentación de Clientes

### Funcionalidades

Clasificar automáticamente.

Categorías:

### Cliente Premium

Más de Q10,000 en compras.

### Cliente Frecuente

Más de 5 compras.

### Cliente Potencial

Sin compras.

### Cliente Inactivo

Más de 180 días sin actividad.

### Beneficio

Permite campañas más efectivas.

---

## Módulo 7: Dashboard Ejecutivo

Pantalla principal del sistema.

Indicadores:

* Total de clientes.
* Clientes nuevos.
* Clientes potenciales.
* Clientes inactivos.
* Ventas registradas.
* Seguimientos pendientes.

Gráficas:

* Clientes por categoría.
* Ventas mensuales.
* Crecimiento de clientes.

---

## Módulo 8: Sistema de Notificaciones

### Funcionalidades

Alertar cuando:

* Exista seguimiento pendiente.
* Un cliente importante no haya sido contactado.
* Exista una oportunidad próxima a vencer.

---

## Módulo 9: Bitácora de Actividades

Registrar automáticamente:

* Quién realizó una acción.
* Fecha.
* Hora.
* Tipo de operación.

### Ejemplo

```text
Usuario: Carlos

Acción:
Actualizó información de cliente

Fecha:
15/06/2026

Hora:
10:15 AM
```

Esto da una apariencia muy profesional al proyecto.

---

# 6. Requerimientos Funcionales

## RF-001

El sistema deberá permitir el registro de usuarios.

## RF-002

El sistema deberá autenticar usuarios mediante correo y contraseña.

## RF-003

El sistema deberá administrar roles de acceso.

## RF-004

El sistema deberá registrar clientes.

## RF-005

El sistema deberá actualizar información de clientes.

## RF-006

El sistema deberá almacenar historial de compras.

## RF-007

El sistema deberá registrar oportunidades de venta.

## RF-008

El sistema deberá generar seguimientos.

## RF-009

El sistema deberá generar recordatorios.

## RF-010

El sistema deberá clasificar clientes automáticamente.

## RF-011

El sistema deberá generar indicadores estadísticos.

## RF-012

El sistema deberá registrar acciones realizadas por los usuarios.

## RF-013

El sistema deberá permitir búsquedas avanzadas.

## RF-014

El sistema deberá permitir exportar información.

---

# 7. Requerimientos No Funcionales

## RNF-001

El sistema deberá estar disponible desde navegadores modernos.

## RNF-002

La respuesta de consultas deberá ser menor a 3 segundos.

## RNF-003

Las contraseñas deberán almacenarse cifradas mediante bcrypt.

## RNF-004

La aplicación deberá ser responsive.

## RNF-005

La base de datos deberá ser no relacional.

## RNF-006

El sistema deberá utilizar HTTPS.

## RNF-007

La arquitectura deberá permitir escalabilidad futura.

---

# 8. Arquitectura Recomendada

```text
Frontend
│
├── HTML
├── CSS
├── JavaScript
│
Backend
│
├── Node.js
├── Express.js
│
Base de Datos
│
└── MongoDB Atlas
```

