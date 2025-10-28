import type { DocumentoAdquisicion, Propiedad } from './schema';

/**
 * Desglose de documentos de adquisición por tipo
 */
export interface DesgloseAdquisicion {
  precio_compra: number;
  gastos_notario: number;
  gastos_registro: number;
  itp: number;
  iva_compra: number;
  gastos_biuro_compra: number;
  gastos_agencia: number;
  mejoras: number;
}

/**
 * Valores catastrales del inmueble
 */
export interface ValoresCatastrales {
  total: number;
  suelo: number;
  construccion: number;
  porcentaje_construccion: number;
}

/**
 * Resultado del cálculo de valor amortizable
 */
export interface ValorAmortizableResult {
  id_propiedad: number;
  direccion: string;
  valor_total_adquisicion: number;
  desglose_adquisicion: DesgloseAdquisicion;
  valores_catastrales: ValoresCatastrales;
  valor_amortizable: number;
  amortizacion_anual: number;
  formula: string;
}

/**
 * Copropietario con su amortización calculada
 */
export interface CopropietarioAmortizacion {
  id_cliente: number;
  nombre: string;
  porcentaje_participacion: number;
  amortizacion_propietario: number;
}

/**
 * Resultado del cálculo de amortización para un año
 */
export interface AmortizacionResult {
  id_propiedad: number;
  direccion: string;
  ano: number;
  dias_alquilados: number;
  dias_sin_alquilar: number;
  amortizacion_anual: number;
  amortizacion_proporcional: number;
  copropietarios: CopropietarioAmortizacion[];
  formula_aplicada: string;
}

/**
 * Calcula el valor amortizable de una propiedad
 * 
 * PASO 1: Suma todos los documentos de adquisición
 * PASO 2: Separa suelo y construcción usando valores catastrales
 * PASO 3: Calcula valor amortizable (solo construcción)
 * PASO 4: Calcula amortización anual (3%)
 * 
 * @param propiedad - Datos de la propiedad
 * @param documentos - Documentos de adquisición validados
 * @returns Resultado con todos los valores calculados
 */
export function calcularValorAmortizable(
  propiedad: Propiedad,
  documentos: DocumentoAdquisicion[]
): ValorAmortizableResult {
  // PASO 1: Sumar todos los documentos de adquisición
  const desglose: DesgloseAdquisicion = {
    precio_compra: 0,
    gastos_notario: 0,
    gastos_registro: 0,
    itp: 0,
    iva_compra: 0,
    gastos_biuro_compra: 0,
    gastos_agencia: 0,
    mejoras: 0
  };

  // Agrupar documentos por tipo
  for (const doc of documentos) {
    const importe = parseFloat(doc.importe);
    if (doc.tipo === 'precio_compra') desglose.precio_compra += importe;
    else if (doc.tipo === 'gastos_notario') desglose.gastos_notario += importe;
    else if (doc.tipo === 'gastos_registro') desglose.gastos_registro += importe;
    else if (doc.tipo === 'itp') desglose.itp += importe;
    else if (doc.tipo === 'iva_compra') desglose.iva_compra += importe;
    else if (doc.tipo === 'gastos_biuro_compra') desglose.gastos_biuro_compra += importe;
    else if (doc.tipo === 'gastos_agencia') desglose.gastos_agencia += importe;
    else if (doc.tipo === 'mejora') desglose.mejoras += importe;
  }

  // Suma total de adquisición
  let valor_total_adquisicion = Object.values(desglose).reduce((sum, val) => sum + val, 0);

  // Si no hay documentos, usar precio_compra de la propiedad
  if (valor_total_adquisicion === 0) {
    valor_total_adquisicion = parseFloat(propiedad.precioCompra || '0');
    desglose.precio_compra = valor_total_adquisicion;
  }

  // PASO 2: Obtener valores catastrales (del recibo IBI)
  const valor_catastral_total = parseFloat(propiedad.valorCatastralTotal || '0');
  const valor_catastral_suelo = parseFloat(propiedad.valorCatastralSuelo || '0');
  const valor_catastral_construccion = parseFloat(propiedad.valorCatastralConstruccion || '0');

  // Validación: valores catastrales obligatorios
  if (!valor_catastral_total || valor_catastral_total <= 0) {
    throw new Error(
      "Valores catastrales no disponibles. " +
      "Debe cargar el recibo del IBI con desglose suelo/construcción."
    );
  }

  // Validación: suelo + construcción = total
  const suma_catastral = valor_catastral_suelo + valor_catastral_construccion;
  if (Math.abs(suma_catastral - valor_catastral_total) > 0.01) {
    throw new Error(
      `ERROR: Suelo (${valor_catastral_suelo.toFixed(2)}€) + ` +
      `Construcción (${valor_catastral_construccion.toFixed(2)}€) ` +
      `≠ Total (${valor_catastral_total.toFixed(2)}€)`
    );
  }

  // Calcular % construcción
  const porcentaje_construccion = valor_catastral_construccion / valor_catastral_total;

  // PASO 3: Calcular valor amortizable
  // Solo se amortiza la CONSTRUCCIÓN (no el suelo)
  const valor_amortizable = Math.round(valor_total_adquisicion * porcentaje_construccion * 100) / 100;

  // PASO 4: Calcular amortización anual (3%)
  const amortizacion_anual = Math.round(valor_amortizable * 0.03 * 100) / 100;

  // Fórmula para auditoría
  const formula = 
    `${valor_total_adquisicion.toFixed(2)}€ × ` +
    `${(porcentaje_construccion * 100).toFixed(2)}% = ` +
    `${valor_amortizable.toFixed(2)}€ → ` +
    `${valor_amortizable.toFixed(2)}€ × 3% = ` +
    `${amortizacion_anual.toFixed(2)}€/año`;

  return {
    id_propiedad: propiedad.idPropiedad,
    direccion: propiedad.direccion,
    valor_total_adquisicion,
    desglose_adquisicion: desglose,
    valores_catastrales: {
      total: valor_catastral_total,
      suelo: valor_catastral_suelo,
      construccion: valor_catastral_construccion,
      porcentaje_construccion: Math.round(porcentaje_construccion * 10000) / 10000
    },
    valor_amortizable,
    amortizacion_anual,
    formula
  };
}

/**
 * Calcula la amortización para un año específico
 * 
 * PASO 1: Obtener amortización anual de la propiedad
 * PASO 2: Prorratear por días alquilados
 * PASO 3: Aplicar % participación de cada copropietario
 * 
 * @param propiedad - Datos de la propiedad (debe tener amortizacion_anual calculado)
 * @param diasAlquilados - Días que estuvo alquilado en el año
 * @param copropietarios - Lista de copropietarios con sus % participación
 * @param ano - Año del cálculo
 * @returns Resultado con amortización por copropietario
 */
export function calcularAmortizacion(
  propiedad: Propiedad,
  diasAlquilados: number,
  copropietarios: Array<{ id_cliente: number; nombre: string; porcentaje_participacion: number }>,
  ano: number
): AmortizacionResult {
  // PASO 1: Obtener amortización anual
  const amortizacion_anual = parseFloat(propiedad.amortizacionAnual || '0');

  if (amortizacion_anual === 0) {
    throw new Error(
      "La propiedad no tiene amortización anual calculada. " +
      "Primero debe calcular el valor amortizable."
    );
  }

  // PASO 2: Prorratear por días alquilados
  const dias_ano = 365; // Simplificación, podría usar 366 para años bisiestos
  const amortizacion_proporcional = Math.round(amortizacion_anual * (diasAlquilados / dias_ano) * 100) / 100;
  const dias_sin_alquilar = dias_ano - diasAlquilados;

  // PASO 3: Aplicar % participación a cada copropietario
  const copropietarios_amortizacion: CopropietarioAmortizacion[] = copropietarios.map(cop => {
    const porcentaje = cop.porcentaje_participacion / 100;
    const amortizacion_propietario = Math.round(amortizacion_proporcional * porcentaje * 100) / 100;
    
    return {
      id_cliente: cop.id_cliente,
      nombre: cop.nombre,
      porcentaje_participacion: cop.porcentaje_participacion,
      amortizacion_propietario
    };
  });

  // Fórmula aplicada
  const formula_aplicada = 
    `${amortizacion_anual.toFixed(2)}€ × (${diasAlquilados}/${dias_ano}) = ` +
    `${amortizacion_proporcional.toFixed(2)}€`;

  return {
    id_propiedad: propiedad.idPropiedad,
    direccion: propiedad.direccion,
    ano,
    dias_alquilados: diasAlquilados,
    dias_sin_alquilar: dias_sin_alquilar,
    amortizacion_anual,
    amortizacion_proporcional,
    copropietarios: copropietarios_amortizacion,
    formula_aplicada
  };
}
