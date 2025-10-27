/**
 * Cálculo del Modelo 210 - Impuesto sobre la Renta de No Residentes (IRNR)
 * Para propiedades en régimen de imputación (vacías o de uso propio)
 */

export interface Modelo210ImputacionInput {
  valorCatastralTotal: string;
  fechaCompra: string;
  tipoPropiedad: 'vivienda' | 'garaje' | 'local' | 'oficina' | 'terreno' | 'otro';
  porcentajePropiedad?: number; // Para copropiedades, default 100
}

export interface Modelo210ImputacionResult {
  baseImponible: number;
  tipoImpositivo: number;
  cuotaIntegra: number;
  importeAPagar: number;
  detalles: {
    valorCatastral: number;
    porcentajeImputacion: number;
    porcentajePropiedad: number;
    baseImponibleCompleta: number;
    baseImponibleProporcional: number;
  };
}

/**
 * Calcula el Modelo 210 para propiedades de imputación
 */
export function calcularModelo210Imputacion(
  input: Modelo210ImputacionInput
): Modelo210ImputacionResult {
  const valorCatastral = parseFloat(input.valorCatastralTotal);
  const porcentajePropiedad = input.porcentajePropiedad || 100;

  if (isNaN(valorCatastral) || valorCatastral <= 0) {
    throw new Error('Valor catastral inválido o faltante');
  }

  if (!input.fechaCompra || input.fechaCompra.trim() === '') {
    throw new Error('Fecha de compra es obligatoria para el cálculo');
  }

  const fechaCompraDate = new Date(input.fechaCompra);
  if (isNaN(fechaCompraDate.getTime())) {
    throw new Error('Fecha de compra inválida');
  }

  if (porcentajePropiedad <= 0 || porcentajePropiedad > 100) {
    throw new Error('Porcentaje de propiedad inválido');
  }

  // Determinar si el valor catastral ha sido revisado en los últimos 10 años
  // Para simplificar, asumimos que valores catastrales recientes usan 1.1%
  // y valores más antiguos usan 2%
  const añosDesdeCompra = (Date.now() - fechaCompraDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Si la propiedad fue comprada hace menos de 10 años, es más probable que
  // el valor catastral sea reciente (1.1%), de lo contrario usar 2%
  const porcentajeImputacion = añosDesdeCompra < 10 ? 1.1 : 2.0;

  // Calcular base imponible
  const baseImponibleCompleta = valorCatastral * (porcentajeImputacion / 100);
  const baseImponibleProporcional = baseImponibleCompleta * (porcentajePropiedad / 100);

  // Tipo impositivo para no residentes: 19% (estándar para la mayoría de países de la UE)
  const tipoImpositivo = 19;

  // Calcular cuota
  const cuotaIntegra = baseImponibleProporcional * (tipoImpositivo / 100);

  return {
    baseImponible: baseImponibleProporcional,
    tipoImpositivo,
    cuotaIntegra,
    importeAPagar: cuotaIntegra,
    detalles: {
      valorCatastral,
      porcentajeImputacion,
      porcentajePropiedad,
      baseImponibleCompleta,
      baseImponibleProporcional,
    },
  };
}

/**
 * Formatea un valor monetario en euros
 */
export function formatEuros(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
