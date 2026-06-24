// ============================================
// GenAIL CRM — Servicio de Segmentación
// Archivo: /backend/services/segmentacionService.js
// Propósito: Clasificar automáticamente a los clientes
//            según su comportamiento de compra y actividad.
// ============================================

/**
 * Clasifica a un cliente basado en sus contadores desnormalizados.
 * 
 * Reglas de negocio:
 * 1. Cliente Premium: Más de Q10,000 en compras acumuladas.
 * 2. Cliente Frecuente: Más de 5 compras realizadas.
 * 3. Cliente Potencial: Sin compras (cantidad de compras === 0).
 * 4. Cliente Inactivo: Más de 180 días sin actividad (interacciones).
 * 
 * @param {Object} cliente - Objeto cliente de Mongoose
 * @returns {string} Categoría calculada ('premium', 'frecuente', 'potencial', 'inactivo')
 */
const calcularCategoriaCliente = (cliente) => {
  const ahora = new Date();
  const ultimaAct = cliente.ultimaActividad ? new Date(cliente.ultimaActividad) : new Date(cliente.createdAt);
  const diffTiempo = Math.abs(ahora - ultimaAct);
  const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

  // 1. Regla Inactivo: Más de 180 días sin actividad
  if (diffDias > 180) {
    return 'inactivo';
  }

  // 2. Regla Premium: Más de Q10,000 en compras
  if (cliente.totalCompras > 10000) {
    return 'premium';
  }

  // 3. Regla Frecuente: Más de 5 compras
  if (cliente.cantidadCompras > 5) {
    return 'frecuente';
  }

  // 4. Regla Potencial: 0 compras
  return 'potencial';
};

/**
 * Actualiza la categoría del cliente en la DB si cambia.
 * @param {Object} cliente - Documento Mongoose de cliente
 */
const actualizarSegmentoCliente = async (cliente) => {
  const nuevaCategoria = calcularCategoriaCliente(cliente);
  if (cliente.categoria !== nuevaCategoria) {
    cliente.categoria = nuevaCategoria;
    await cliente.save();
    return true; // Indicador de que cambió
  }
  return false;
};

module.exports = {
  calcularCategoriaCliente,
  actualizarSegmentoCliente
};
