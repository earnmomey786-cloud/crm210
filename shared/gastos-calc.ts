import type { Gasto } from './schema';

/**
 * FASE 1E: CÁLCULO DE GASTOS DEDUCIBLES PARA MODELO 210
 * 
 * Normativa fiscal española para gastos deducibles en alquiler:
 * 
 * 1. GASTOS PROPORCIONALES (se prorratean por días alquilados):
 *    - IBI, Comunidad, Seguros, Intereses hipoteca, Suministros, Conservación
 *    - Fórmula: Gasto × (Días alquilados / 365)
 * 
 * 2. GASTOS 100% DEDUCIBLES (sin prorratear):
 *    - Reparaciones, Gestoría/Biuro, Agencia inmobiliaria, Abogado, Publicidad
 * 
 * 3. RENTAS NEGATIVAS:
 *    - Solo REPARACIONES + INTERESES HIPOTECA pueden generar rentas negativas compensables
 *    - Otros gastos: máximo hasta que renta = 0€ (no generan saldo negativo)
 *    - Rentas negativas se compensan en los 4 años siguientes
 */

export interface GastoDetalle {
  idGasto: number;
  tipo: string;
  descripcion: string;
  importeTotal: number;
  importeDeducible: number;
  esProporcional: boolean;
  generaRentaNegativa: boolean;
}

export interface GastosDeduciblesResult {
  idPropiedad: number;
  ano: number;
  diasAlquilados: number;
  diasSinAlquilar: number;

  // Gastos proporcionales
  gastosProporcionales: Record<string, {
    importeTotal: number;
    importeDeducible: number;
  }> & {
    subtotal: number;
  };

  // Gastos 100% deducibles
  gastos100Deducibles: Record<string, number> & {
    subtotal: number;
  };

  totalGastosDeducibles: number;
  formula: string;
}

export interface RentaNegativaResult {
  idPropiedad: number;
  ano: number;

  ingresos: number;
  gastosDeducibles: number;
  amortizacion: number;

  // Detalle de gastos que generan renta negativa
  reparaciones: number;
  interesesHipoteca: number;
  otrosGastos: number;

  resultadoAntesLimites: number;
  tieneRentaNegativa: boolean;
  importeRentaNegativa: number;
  baseImponibleFinal: number;
  cuotaPagar: number;
  concepto: string;
  observaciones: string;
}

/**
 * Verifica si un tipo de gasto es proporcional
 */
export function esGastoProporcional(tipoGasto: string): boolean {
  const gastosProporcionales = [
    'ibi',
    'comunidad',
    'seguro',
    'intereses_hipoteca',
    'suministros',
    'conservacion'
  ];
  return gastosProporcionales.includes(tipoGasto);
}

/**
 * Verifica si un tipo de gasto puede generar renta negativa
 */
export function generaRentaNegativa(tipoGasto: string): boolean {
  return tipoGasto === 'reparacion' || tipoGasto === 'intereses_hipoteca';
}

/**
 * Calcula los gastos deducibles de una propiedad para un año
 * 
 * @param gastos - Lista de gastos de la propiedad
 * @param diasAlquilados - Días que estuvo alquilada en el año
 * @param ano - Año fiscal
 * @returns Objeto con detalle de gastos deducibles
 */
export function calcularGastosDeducibles(
  gastos: Gasto[],
  diasAlquilados: number,
  ano: number
): GastosDeduciblesResult {
  const diasTotalesAno = 365; // Simplificación, se puede ajustar por año bisiesto
  const diasSinAlquilar = diasTotalesAno - diasAlquilados;

  // Clasificar gastos
  const gastosProporcionales: any = {};
  const gastos100Deducibles: any = {};

  let subtotalProporcionales = 0;
  let subtotal100Deducibles = 0;

  for (const gasto of gastos) {
    const importe = parseFloat(gasto.importe);

    if (esGastoProporcional(gasto.tipoGasto)) {
      // Gasto proporcional: prorratear por días alquilados
      const importeDeducible = (importe * diasAlquilados) / diasTotalesAno;

      if (!gastosProporcionales[gasto.tipoGasto]) {
        gastosProporcionales[gasto.tipoGasto] = {
          importeTotal: 0,
          importeDeducible: 0
        };
      }

      gastosProporcionales[gasto.tipoGasto].importeTotal += importe;
      gastosProporcionales[gasto.tipoGasto].importeDeducible += importeDeducible;
      subtotalProporcionales += importeDeducible;
    } else {
      // Gasto 100% deducible
      if (!gastos100Deducibles[gasto.tipoGasto]) {
        gastos100Deducibles[gasto.tipoGasto] = 0;
      }

      gastos100Deducibles[gasto.tipoGasto] += importe;
      subtotal100Deducibles += importe;
    }
  }

  gastosProporcionales.subtotal = subtotalProporcionales;
  gastos100Deducibles.subtotal = subtotal100Deducibles;

  const totalGastosDeducibles = subtotalProporcionales + subtotal100Deducibles;

  // Generar fórmula explicativa
  const formula = `Proporcionales: ${subtotalProporcionales.toFixed(2)}€ × (${diasAlquilados}/${diasTotalesAno}) | 100%: ${subtotal100Deducibles.toFixed(2)}€`;

  return {
    idPropiedad: gastos[0]?.idPropiedad || 0,
    ano,
    diasAlquilados,
    diasSinAlquilar,
    gastosProporcionales,
    gastos100Deducibles,
    totalGastosDeducibles,
    formula
  };
}

/**
 * Verifica si hay renta negativa y calcula el importe
 * 
 * CRÍTICO: Solo reparaciones e intereses hipoteca pueden generar rentas negativas compensables.
 * Otros gastos solo pueden reducir la base imponible hasta 0€.
 * 
 * @param ingresos - Ingresos por alquiler en el año
 * @param gastosDeducibles - Total de gastos deducibles
 * @param amortizacion - Amortización del año
 * @param gastos - Lista de gastos para clasificar
 * @param tipoImpositivo - Tipo impositivo (por defecto 19%)
 * @returns Resultado con detalle de renta negativa
 */
export function verificarRentaNegativa(
  ingresos: number,
  gastosDeducibles: number,
  amortizacion: number,
  gastos: Gasto[],
  tipoImpositivo: number = 0.19
): RentaNegativaResult {
  // Clasificar gastos según si generan renta negativa o no
  let reparaciones = 0;
  let interesesHipoteca = 0;
  let otrosGastos = 0;

  for (const gasto of gastos) {
    const importe = parseFloat(gasto.importe);

    if (gasto.tipoGasto === 'reparacion') {
      reparaciones += importe;
    } else if (gasto.tipoGasto === 'intereses_hipoteca') {
      // Intereses hipoteca son proporcionales, calcular parte deducible
      // Aquí asumimos que ya vienen prorrateados en gastosDeducibles
      interesesHipoteca += importe;
    } else {
      otrosGastos += importe;
    }
  }

  // Cálculo inicial
  const resultadoAntesLimites = ingresos - gastosDeducibles - amortizacion;

  let tieneRentaNegativa = false;
  let importeRentaNegativa = 0;
  let baseImponibleFinal = 0;
  let concepto = '';
  let observaciones = '';

  if (resultadoAntesLimites < 0) {
    // Hay resultado negativo
    // Solo reparaciones + intereses pueden generar renta negativa compensable
    const gastosQueGeneranRentaNegativa = reparaciones + interesesHipoteca;

    if (gastosQueGeneranRentaNegativa > 0) {
      // Puede haber renta negativa compensable
      // Calcular cuánto de la pérdida es por reparaciones/intereses
      const rentaNegativaPorReparacionesIntereses = Math.min(
        Math.abs(resultadoAntesLimites),
        gastosQueGeneranRentaNegativa
      );

      if (rentaNegativaPorReparacionesIntereses > 0) {
        tieneRentaNegativa = true;
        importeRentaNegativa = rentaNegativaPorReparacionesIntereses;
        baseImponibleFinal = 0;

        if (reparaciones > 0 && interesesHipoteca > 0) {
          concepto = 'mixto';
        } else if (reparaciones > 0) {
          concepto = 'reparaciones';
        } else {
          concepto = 'intereses';
        }

        observaciones = `Renta negativa de ${importeRentaNegativa.toFixed(2)}€. Se puede compensar hasta ${new Date().getFullYear() + 4}.`;
      } else {
        // No hay renta negativa porque otros gastos compensan
        baseImponibleFinal = 0;
        observaciones = 'Renta cero. Los gastos ordinarios compensan los ingresos.';
      }
    } else {
      // Solo hay otros gastos, no puede haber renta negativa
      baseImponibleFinal = 0;
      observaciones = 'Renta cero. Solo hay gastos ordinarios (no generan renta negativa compensable).';
    }
  } else {
    // Resultado positivo
    baseImponibleFinal = resultadoAntesLimites;
    observaciones = 'Renta positiva. No hay rentas negativas.';
  }

  const cuotaPagar = baseImponibleFinal * tipoImpositivo;

  return {
    idPropiedad: gastos[0]?.idPropiedad || 0,
    ano: new Date().getFullYear(),
    ingresos,
    gastosDeducibles,
    amortizacion,
    reparaciones,
    interesesHipoteca,
    otrosGastos,
    resultadoAntesLimites,
    tieneRentaNegativa,
    importeRentaNegativa,
    baseImponibleFinal,
    cuotaPagar,
    concepto,
    observaciones
  };
}

/**
 * Calcula el importe máximo que se puede compensar de una renta negativa
 * 
 * @param importePendiente - Importe pendiente de compensar
 * @param baseImponibleDeclaracion - Base imponible de la declaración actual
 * @returns Importe máximo a compensar
 */
export function calcularImporteMaximoCompensacion(
  importePendiente: number,
  baseImponibleDeclaracion: number
): number {
  // El importe máximo a compensar es el menor entre:
  // 1. Lo que queda pendiente de la renta negativa
  // 2. La base imponible de la declaración actual
  return Math.min(importePendiente, baseImponibleDeclaracion);
}

/**
 * Obtiene un nombre legible para un tipo de gasto
 */
export function obtenerNombreTipoGasto(tipoGasto: string): string {
  const nombres: { [key: string]: string } = {
    'ibi': 'IBI (Impuesto Bienes Inmuebles)',
    'comunidad': 'Comunidad de propietarios',
    'seguro': 'Seguros',
    'intereses_hipoteca': 'Intereses hipoteca',
    'suministros': 'Suministros',
    'conservacion': 'Gastos de conservación',
    'reparacion': 'Reparaciones',
    'biuro': 'Gestoría/Biuro',
    'agencia': 'Agencia inmobiliaria',
    'abogado': 'Servicios jurídicos',
    'publicidad': 'Publicidad',
    'otro': 'Otros gastos'
  };

  return nombres[tipoGasto] || tipoGasto;
}
