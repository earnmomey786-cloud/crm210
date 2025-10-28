/**
 * Cálculo del Modelo 210 - Impuesto sobre la Renta de No Residentes (IRNR)
 * Para propiedades en régimen de imputación (vacías o de uso propio)
 */

export interface Modelo210ImputacionInput {
  valorCatastralTotal: string;
  fechaCompra: string;
  tipoPropiedad: 'vivienda' | 'garaje' | 'local' | 'oficina' | 'terreno' | 'otro';
  porcentajePropiedad?: number; // Para copropiedades, default 100
  ano?: number; // Año fiscal, default año actual
  dias?: number; // Días del año, default 365
  porcentajeAplicado?: number; // Porcentaje de imputación manual (1.1 o 2.0)
}

export interface Modelo210ImputacionResult {
  baseImponible: number;
  tipoImpositivo: number;
  cuotaIntegra: number;
  importeAPagar: number;
  ano: number;
  dias: number;
  detalles: {
    valorCatastral: number;
    porcentajeImputacion: number;
    porcentajePropiedad: number;
    baseImponibleCompleta: number;
    baseImponibleProporcional: number;
    rentaImputada: number;
  };
  formula: string;
}

/**
 * Calcula el Modelo 210 para propiedades de imputación
 */
export function calcularModelo210Imputacion(
  input: Modelo210ImputacionInput
): Modelo210ImputacionResult {
  const valorCatastral = parseFloat(input.valorCatastralTotal);
  const porcentajePropiedad = input.porcentajePropiedad || 100;
  const ano = input.ano || new Date().getFullYear();
  const dias = input.dias || 365;

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

  if (dias < 1 || dias > 365) {
    throw new Error('Días debe estar entre 1 y 365');
  }

  // Determinar porcentaje de imputación
  let porcentajeImputacion: number;
  
  if (input.porcentajeAplicado !== undefined) {
    // Si se proporciona manualmente
    if (input.porcentajeAplicado !== 1.1 && input.porcentajeAplicado !== 2.0) {
      throw new Error('Porcentaje aplicado debe ser 1.1 o 2.0');
    }
    porcentajeImputacion = input.porcentajeAplicado;
  } else {
    // Auto-determinar basado en antigüedad
    const añosDesdeCompra = (Date.now() - fechaCompraDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    porcentajeImputacion = añosDesdeCompra < 10 ? 1.1 : 2.0;
  }

  // PASO 1: Calcular renta imputada total
  // Fórmula: Valor Catastral × (Porcentaje / 100) × (Días / 365)
  const rentaImputadaCompleta = valorCatastral * (porcentajeImputacion / 100) * (dias / 365);

  // PASO 2: Aplicar porcentaje de propiedad (para copropiedades)
  const rentaImputada = rentaImputadaCompleta * (porcentajePropiedad / 100);

  // PASO 3: Base imponible = Renta imputada (en imputación no hay deducciones)
  const baseImponible = rentaImputada;

  // PASO 4: Tipo impositivo para no residentes UE: 19%
  const tipoImpositivo = 19;

  // PASO 5: Calcular cuota a pagar
  const cuotaIntegra = baseImponible * (tipoImpositivo / 100);

  // Generar fórmula textual para auditoría
  const formula = `${formatEuros(valorCatastral)} × ${porcentajeImputacion}% × (${dias}/365) × ${porcentajePropiedad.toFixed(2)}% = ${formatEuros(rentaImputada)} → ${formatEuros(rentaImputada)} × ${tipoImpositivo}% = ${formatEuros(cuotaIntegra)}`;

  return {
    baseImponible: Math.round(baseImponible * 100) / 100,
    tipoImpositivo,
    cuotaIntegra: Math.round(cuotaIntegra * 100) / 100,
    importeAPagar: Math.round(cuotaIntegra * 100) / 100,
    ano,
    dias,
    detalles: {
      valorCatastral,
      porcentajeImputacion,
      porcentajePropiedad,
      baseImponibleCompleta: Math.round(rentaImputadaCompleta * 100) / 100,
      baseImponibleProporcional: Math.round(baseImponible * 100) / 100,
      rentaImputada: Math.round(rentaImputada * 100) / 100,
    },
    formula,
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
