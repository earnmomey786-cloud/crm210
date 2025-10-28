import type { ContratoAlquiler } from './schema';

export interface ContratoConDias {
  idContrato: number;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioEfectiva: string;
  fechaFinEfectiva: string;
  diasEnAno: number;
  rentaMensual: string;
  ingresosEstimados: number;
  inquilino: string;
  estado: string;
}

export interface ResultadoDiasAlquilados {
  idPropiedad: number;
  ano: number;
  diasTotalesAno: number;
  contratos: ContratoConDias[];
  numContratos: number;
  totalDiasAlquilados: number;
  totalDiasSinAlquilar: number;
  porcentajeOcupacion: number;
  ingresosTotalesEstimados: number;
}

/**
 * Calcula el total de días que estuvo alquilada una propiedad en un año específico
 * 
 * CRÍTICO: Esta función es la BASE para calcular amortización proporcional en Modelo 210.
 * 
 * @param contratos - Lista de contratos de la propiedad (solo los activos/finalizados)
 * @param ano - Año fiscal (ej: 2024)
 * @returns Objeto con días alquilados, contratos y desglose
 */
export function calcularDiasAlquilados(
  contratos: ContratoAlquiler[],
  ano: number
): ResultadoDiasAlquilados {
  // VALIDACIÓN CRÍTICA: Detectar solapamientos ANTES de calcular
  const solapamientos = detectarSolapamientos(contratos);
  if (solapamientos.length > 0) {
    const detalles = solapamientos.map(({ contrato1, contrato2 }) => {
      const inquilino1 = contrato1.apellidosInquilino
        ? `${contrato1.nombreInquilino} ${contrato1.apellidosInquilino}`.trim()
        : contrato1.nombreInquilino;
      const inquilino2 = contrato2.apellidosInquilino
        ? `${contrato2.nombreInquilino} ${contrato2.apellidosInquilino}`.trim()
        : contrato2.nombreInquilino;
      
      return `Contrato #${contrato1.idContrato} (${inquilino1}, ${contrato1.fechaInicio} - ${contrato1.fechaFin}) se solapa con Contrato #${contrato2.idContrato} (${inquilino2}, ${contrato2.fechaInicio} - ${contrato2.fechaFin})`;
    }).join('; ');
    
    throw new Error(
      `ERROR: Hay ${solapamientos.length} contrato(s) solapado(s). ` +
      `No es posible calcular días alquilados con contratos solapados. ` +
      `Detalles: ${detalles}`
    );
  }

  // Fechas límite del año
  const fechaInicioAno = new Date(ano, 0, 1); // 1 de enero
  const fechaFinAno = new Date(ano, 11, 31); // 31 de diciembre

  // Calcular días del año (365 o 366 si bisiesto)
  const diasTotalesAno = Math.floor(
    (fechaFinAno.getTime() - fechaInicioAno.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Filtrar contratos que intersectan con el año
  const contratosEnAno = contratos.filter(contrato => {
    const inicioContrato = new Date(contrato.fechaInicio);
    const finContrato = new Date(contrato.fechaFin);
    
    // El contrato debe estar en estado válido
    if (!['activo', 'finalizado', 'renovado'].includes(contrato.estado)) {
      return false;
    }

    // El contrato debe solaparse con el año
    return inicioContrato <= fechaFinAno && finContrato >= fechaInicioAno;
  });

  if (contratosEnAno.length === 0) {
    return {
      idPropiedad: contratos[0]?.idPropiedad || 0,
      ano,
      diasTotalesAno,
      contratos: [],
      numContratos: 0,
      totalDiasAlquilados: 0,
      totalDiasSinAlquilar: diasTotalesAno,
      porcentajeOcupacion: 0.0,
      ingresosTotalesEstimados: 0.0,
    };
  }

  // Calcular días por cada contrato
  const contratosInfo: ContratoConDias[] = [];
  let totalDiasAlquilados = 0;

  for (const contrato of contratosEnAno) {
    const inicioContrato = new Date(contrato.fechaInicio);
    const finContrato = new Date(contrato.fechaFin);

    // Intersección del contrato con el año
    const inicioEfectivo = inicioContrato > fechaInicioAno ? inicioContrato : fechaInicioAno;
    const finEfectivo = finContrato < fechaFinAno ? finContrato : fechaFinAno;

    // Calcular días (inclusivo: inicio y fin cuentan)
    const diasEnAno = Math.floor(
      (finEfectivo.getTime() - inicioEfectivo.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Acumular
    totalDiasAlquilados += diasEnAno;

    // Calcular ingresos del contrato en este año
    const mesesEnAno = diasEnAno / 30.44; // Promedio días por mes
    const rentaMensual = parseFloat(contrato.rentaMensual.toString());
    const ingresosEstimados = rentaMensual * mesesEnAno;

    // Nombre completo del inquilino
    const inquilino = contrato.apellidosInquilino
      ? `${contrato.nombreInquilino} ${contrato.apellidosInquilino}`.trim()
      : contrato.nombreInquilino;

    contratosInfo.push({
      idContrato: contrato.idContrato,
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin,
      fechaInicioEfectiva: inicioEfectivo.toISOString().split('T')[0],
      fechaFinEfectiva: finEfectivo.toISOString().split('T')[0],
      diasEnAno,
      rentaMensual: contrato.rentaMensual.toString(),
      ingresosEstimados: Math.round(ingresosEstimados * 100) / 100,
      inquilino,
      estado: contrato.estado,
    });
  }

  // VALIDACIÓN: Total no puede exceder días del año
  if (totalDiasAlquilados > diasTotalesAno) {
    throw new Error(
      `ERROR: Días alquilados (${totalDiasAlquilados}) > días del año (${diasTotalesAno}). ` +
      `Revise contratos por solapamiento.`
    );
  }

  // Calcular días sin alquilar
  const diasSinAlquilar = diasTotalesAno - totalDiasAlquilados;

  // Porcentaje de ocupación
  const porcentajeOcupacion = (totalDiasAlquilados / diasTotalesAno) * 100;

  // Ingresos totales estimados
  const ingresosTotales = contratosInfo.reduce(
    (sum, c) => sum + c.ingresosEstimados,
    0
  );

  return {
    idPropiedad: contratos[0].idPropiedad,
    ano,
    diasTotalesAno,
    contratos: contratosInfo,
    numContratos: contratosInfo.length,
    totalDiasAlquilados,
    totalDiasSinAlquilar: diasSinAlquilar,
    porcentajeOcupacion: Math.round(porcentajeOcupacion * 100) / 100,
    ingresosTotalesEstimados: Math.round(ingresosTotales * 100) / 100,
  };
}

/**
 * Detecta si hay contratos solapados (error de datos)
 * 
 * @param contratos - Lista de contratos de una propiedad
 * @returns Array de pares de contratos que se solapan
 */
export function detectarSolapamientos(
  contratos: ContratoAlquiler[]
): Array<{ contrato1: ContratoAlquiler; contrato2: ContratoAlquiler }> {
  const solapamientos: Array<{ contrato1: ContratoAlquiler; contrato2: ContratoAlquiler }> = [];

  // Filtrar solo contratos activos/renovados/finalizados
  const contratosValidos = contratos.filter(c =>
    ['activo', 'finalizado', 'renovado'].includes(c.estado)
  );

  // Ordenar por fecha de inicio
  const contratosOrdenados = [...contratosValidos].sort((a, b) => {
    const fechaA = new Date(a.fechaInicio).getTime();
    const fechaB = new Date(b.fechaInicio).getTime();
    return fechaA - fechaB;
  });

  // Verificar cada par de contratos
  for (let i = 0; i < contratosOrdenados.length; i++) {
    const c1 = contratosOrdenados[i];
    const fecha1Inicio = new Date(c1.fechaInicio);
    const fecha1Fin = new Date(c1.fechaFin);

    for (let j = i + 1; j < contratosOrdenados.length; j++) {
      const c2 = contratosOrdenados[j];
      const fecha2Inicio = new Date(c2.fechaInicio);
      const fecha2Fin = new Date(c2.fechaFin);

      // Verificar si se solapan
      const seSolapan =
        fecha1Fin >= fecha2Inicio && fecha1Inicio <= fecha2Fin;

      if (seSolapan) {
        solapamientos.push({ contrato1: c1, contrato2: c2 });
      }
    }
  }

  return solapamientos;
}
