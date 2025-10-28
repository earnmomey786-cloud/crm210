import { sql, relations } from "drizzle-orm";
import { pgTable, serial, varchar, text, boolean, timestamp, integer, decimal, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clientes = pgTable("clientes", {
  idCliente: serial("id_cliente").primaryKey(),
  nie: varchar("nie", { length: 12 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellidos: varchar("apellidos", { length: 200 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  telefono: varchar("telefono", { length: 20 }).notNull(),
  ciudadPolonia: varchar("ciudad_polonia", { length: 100 }),
  direccionPolonia: text("direccion_polonia"),
  activo: boolean("activo").default(true).notNull(),
  fechaAlta: timestamp("fecha_alta").defaultNow().notNull(),
  notas: text("notas"),
}, (table) => ({
  nieIdx: index("idx_nie").on(table.nie),
  nombreIdx: index("idx_nombre").on(table.nombre),
}));

export const propiedades = pgTable("propiedades", {
  idPropiedad: serial("id_propiedad").primaryKey(),
  idCliente: integer("id_cliente").notNull().references(() => clientes.idCliente),
  referenciaCatastral: varchar("referencia_catastral", { length: 20 }).notNull().unique(),
  direccion: varchar("direccion", { length: 500 }).notNull(),
  provincia: varchar("provincia", { length: 100 }),
  municipio: varchar("municipio", { length: 100 }),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  tipoDeclaracion: varchar("tipo_declaracion", { length: 20 }).notNull().default('imputacion'),
  fechaCompra: date("fecha_compra").notNull(),
  precioCompra: decimal("precio_compra", { precision: 12, scale: 2 }).notNull(),
  valorCatastralTotal: decimal("valor_catastral_total", { precision: 12, scale: 2 }),
  valorCatastralSuelo: decimal("valor_catastral_suelo", { precision: 12, scale: 2 }),
  valorCatastralConstruccion: decimal("valor_catastral_construccion", { precision: 12, scale: 2 }),
  valorTotalAdquisicion: decimal("valor_total_adquisicion", { precision: 12, scale: 2 }),
  porcentajeConstruccion: decimal("porcentaje_construccion", { precision: 5, scale: 4 }),
  valorAmortizable: decimal("valor_amortizable", { precision: 12, scale: 2 }),
  amortizacionAnual: decimal("amortizacion_anual", { precision: 12, scale: 2 }),
  activa: boolean("activa").default(true).notNull(),
  fechaAlta: timestamp("fecha_alta").defaultNow().notNull(),
  notas: text("notas"),
}, (table) => ({
  clienteIdx: index("idx_cliente").on(table.idCliente),
  tipoDeclaracionIdx: index("idx_tipo_declaracion").on(table.tipoDeclaracion),
}));

export const propiedadCopropietarios = pgTable("propiedad_copropietarios", {
  id: serial("id").primaryKey(),
  idPropiedad: integer("id_propiedad").notNull().references(() => propiedades.idPropiedad),
  idCliente: integer("id_cliente").notNull().references(() => clientes.idCliente),
  porcentaje: decimal("porcentaje", { precision: 5, scale: 2 }).notNull(),
  fechaInicio: date("fecha_inicio").notNull(),
  activo: boolean("activo").default(true).notNull(),
}, (table) => ({
  propiedadIdx: index("idx_propiedad_cop").on(table.idPropiedad),
}));

export const declaraciones210 = pgTable("declaraciones_210", {
  idDeclaracion: serial("id_declaracion").primaryKey(),
  idPropiedad: integer("id_propiedad").notNull().references(() => propiedades.idPropiedad),
  idCliente: integer("id_cliente").notNull().references(() => clientes.idCliente),
  ano: integer("ano").notNull(),
  trimestre: integer("trimestre"),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  modalidad: varchar("modalidad", { length: 20 }).notNull(),
  diasDeclarados: integer("dias_declarados").notNull(),
  valorCatastralBase: decimal("valor_catastral_base", { precision: 12, scale: 2 }),
  porcentajeAplicado: decimal("porcentaje_aplicado", { precision: 5, scale: 4 }),
  rentaImputada: decimal("renta_imputada", { precision: 12, scale: 2 }),
  ingresosAlquiler: decimal("ingresos_alquiler", { precision: 12, scale: 2 }),
  gastosDeducibles: decimal("gastos_deducibles", { precision: 12, scale: 2 }),
  amortizacion: decimal("amortizacion", { precision: 12, scale: 2 }),
  valorTotalAdquisicion: decimal("valor_total_adquisicion", { precision: 12, scale: 2 }),
  valorAmortizable: decimal("valor_amortizable", { precision: 12, scale: 2 }),
  amortizacionAnualPropiedad: decimal("amortizacion_anual_propiedad", { precision: 12, scale: 2 }),
  amortizacionProporcionalDias: decimal("amortizacion_proporcional_dias", { precision: 12, scale: 2 }),
  amortizacionPropietario: decimal("amortizacion_propietario", { precision: 12, scale: 2 }),
  baseImponible: decimal("base_imponible", { precision: 12, scale: 2 }).notNull(),
  cuotaPagar: decimal("cuota_pagar", { precision: 12, scale: 2 }).notNull(),
  porcentajeParticipacion: decimal("porcentaje_participacion", { precision: 5, scale: 2 }).default('100.00').notNull(),
  estado: varchar("estado", { length: 20 }).default('borrador').notNull(),
  fechaPresentacion: date("fecha_presentacion"),
  fechaCalculo: timestamp("fecha_calculo").defaultNow().notNull(),
  usuarioCalculo: varchar("usuario_calculo", { length: 100 }),
  formulaAplicada: text("formula_aplicada"),
}, (table) => ({
  propiedadIdx: index("idx_decl_propiedad").on(table.idPropiedad),
  clienteIdx: index("idx_decl_cliente").on(table.idCliente),
  anoIdx: index("idx_decl_ano").on(table.ano),
  tipoIdx: index("idx_decl_tipo").on(table.tipo),
}));

export const contratosAlquiler = pgTable("contratos_alquiler", {
  idContrato: serial("id_contrato").primaryKey(),
  idPropiedad: integer("id_propiedad").notNull().references(() => propiedades.idPropiedad),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  rentaMensual: decimal("renta_mensual", { precision: 10, scale: 2 }).notNull(),
  formaPago: varchar("forma_pago", { length: 50 }),
  diaPago: integer("dia_pago"),
  deposito: decimal("deposito", { precision: 10, scale: 2 }),
  nombreInquilino: varchar("nombre_inquilino", { length: 200 }).notNull(),
  apellidosInquilino: varchar("apellidos_inquilino", { length: 200 }),
  dniNieInquilino: varchar("dni_nie_inquilino", { length: 12 }),
  emailInquilino: varchar("email_inquilino", { length: 150 }),
  telefonoInquilino: varchar("telefono_inquilino", { length: 20 }),
  rutaContratoPdf: varchar("ruta_contrato_pdf", { length: 500 }),
  estado: varchar("estado", { length: 20 }).default('activo').notNull(),
  motivoCancelacion: text("motivo_cancelacion"),
  fechaAlta: timestamp("fecha_alta").defaultNow().notNull(),
  usuarioAlta: varchar("usuario_alta", { length: 100 }),
  observaciones: text("observaciones"),
}, (table) => ({
  propiedadIdx: index("idx_contrato_propiedad").on(table.idPropiedad),
  fechasIdx: index("idx_contrato_fechas").on(table.fechaInicio, table.fechaFin),
  estadoIdx: index("idx_contrato_estado").on(table.estado),
  inquilinoIdx: index("idx_contrato_inquilino").on(table.nombreInquilino),
}));

export const pagosAlquiler = pgTable("pagos_alquiler", {
  idPago: serial("id_pago").primaryKey(),
  idContrato: integer("id_contrato").notNull().references(() => contratosAlquiler.idContrato),
  fechaPago: date("fecha_pago").notNull(),
  mesCorrespondiente: integer("mes_correspondiente"),
  anoCorrespondiente: integer("ano_correspondiente").notNull(),
  importe: decimal("importe", { precision: 10, scale: 2 }).notNull(),
  estado: varchar("estado", { length: 20 }).default('pendiente').notNull(),
  metodoPago: varchar("metodo_pago", { length: 50 }),
  referenciaBancaria: varchar("referencia_bancaria", { length: 100 }),
  rutaJustificante: varchar("ruta_justificante", { length: 500 }),
  fechaRegistro: timestamp("fecha_registro").defaultNow().notNull(),
}, (table) => ({
  contratoIdx: index("idx_pago_contrato").on(table.idContrato),
  fechaIdx: index("idx_pago_fecha").on(table.fechaPago),
  estadoIdx: index("idx_pago_estado").on(table.estado),
}));

export const documentosAdquisicion = pgTable("documentos_adquisicion", {
  idDocumento: serial("id_documento").primaryKey(),
  idPropiedad: integer("id_propiedad").notNull().references(() => propiedades.idPropiedad),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  descripcion: varchar("descripcion", { length: 500 }).notNull(),
  importe: decimal("importe", { precision: 12, scale: 2 }).notNull(),
  fechaDocumento: date("fecha_documento").notNull(),
  rutaArchivo: varchar("ruta_archivo", { length: 500 }),
  validado: boolean("validado").default(false).notNull(),
  fechaValidacion: timestamp("fecha_validacion"),
  fechaAlta: timestamp("fecha_alta").defaultNow().notNull(),
  usuarioAlta: varchar("usuario_alta", { length: 100 }),
}, (table) => ({
  propiedadIdx: index("idx_doc_adq_propiedad").on(table.idPropiedad),
  tipoIdx: index("idx_doc_adq_tipo").on(table.tipo),
}));

export const gastos = pgTable("gastos", {
  idGasto: serial("id_gasto").primaryKey(),
  idPropiedad: integer("id_propiedad").notNull().references(() => propiedades.idPropiedad),
  tipoGasto: varchar("tipo_gasto", { length: 50 }).notNull(),
  esProporcional: boolean("es_proporcional").generatedAlwaysAs(sql`tipo_gasto IN ('ibi', 'comunidad', 'seguro', 'intereses_hipoteca', 'suministros', 'conservacion')`),
  generaRentaNegativa: boolean("genera_renta_negativa").generatedAlwaysAs(sql`tipo_gasto IN ('reparacion', 'intereses_hipoteca')`),
  descripcion: varchar("descripcion", { length: 500 }).notNull(),
  importe: decimal("importe", { precision: 10, scale: 2 }).notNull(),
  fechaGasto: date("fecha_gasto").notNull(),
  fechaInicioPeriodo: date("fecha_inicio_periodo"),
  fechaFinPeriodo: date("fecha_fin_periodo"),
  nombreProveedor: varchar("nombre_proveedor", { length: 200 }),
  numeroFactura: varchar("numero_factura", { length: 100 }),
  rutaFactura: varchar("ruta_factura", { length: 500 }),
  validado: boolean("validado").default(false).notNull(),
  fechaValidacion: timestamp("fecha_validacion"),
  fechaRegistro: timestamp("fecha_registro").defaultNow().notNull(),
  usuarioRegistro: varchar("usuario_registro", { length: 100 }),
  observaciones: text("observaciones"),
}, (table) => ({
  propiedadIdx: index("idx_gasto_propiedad").on(table.idPropiedad),
  tipoIdx: index("idx_gasto_tipo").on(table.tipoGasto),
  fechaIdx: index("idx_gasto_fecha").on(table.fechaGasto),
  validadoIdx: index("idx_gasto_validado").on(table.validado),
}));

export const rentasNegativas = pgTable("rentas_negativas", {
  idRentaNegativa: serial("id_renta_negativa").primaryKey(),
  idPropiedad: integer("id_propiedad").notNull().references(() => propiedades.idPropiedad),
  idCliente: integer("id_cliente").notNull().references(() => clientes.idCliente),
  anoOrigen: integer("ano_origen").notNull(),
  importeNegativo: decimal("importe_negativo", { precision: 12, scale: 2 }).notNull(),
  concepto: varchar("concepto", { length: 50 }).notNull(),
  importeCompensado: decimal("importe_compensado", { precision: 12, scale: 2 }).default('0.00').notNull(),
  importePendiente: decimal("importe_pendiente", { precision: 12, scale: 2 }).generatedAlwaysAs(sql`importe_negativo - importe_compensado`),
  anoLimite: integer("ano_limite").generatedAlwaysAs(sql`ano_origen + 4`),
  estado: varchar("estado", { length: 20 }).default('pendiente').notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  observaciones: text("observaciones"),
}, (table) => ({
  propiedadIdx: index("idx_rn_propiedad").on(table.idPropiedad),
  clienteIdx: index("idx_rn_cliente").on(table.idCliente),
  anoIdx: index("idx_rn_ano").on(table.anoOrigen),
  estadoIdx: index("idx_rn_estado").on(table.estado),
}));

export const compensacionesRentasNegativas = pgTable("compensaciones_rentas_negativas", {
  idCompensacion: serial("id_compensacion").primaryKey(),
  idRentaNegativa: integer("id_renta_negativa").notNull().references(() => rentasNegativas.idRentaNegativa),
  idDeclaracion: integer("id_declaracion").notNull().references(() => declaraciones210.idDeclaracion),
  anoCompensacion: integer("ano_compensacion").notNull(),
  importeCompensado: decimal("importe_compensado", { precision: 12, scale: 2 }).notNull(),
  fechaCompensacion: timestamp("fecha_compensacion").defaultNow().notNull(),
  usuario: varchar("usuario", { length: 100 }),
}, (table) => ({
  rentaNegativaIdx: index("idx_comp_rn").on(table.idRentaNegativa),
  declaracionIdx: index("idx_comp_decl").on(table.idDeclaracion),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  propiedades: many(propiedades),
  copropiedades: many(propiedadCopropietarios),
  declaraciones: many(declaraciones210),
  rentasNegativas: many(rentasNegativas),
}));

export const propiedadesRelations = relations(propiedades, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [propiedades.idCliente],
    references: [clientes.idCliente],
  }),
  copropietarios: many(propiedadCopropietarios),
  declaraciones: many(declaraciones210),
  contratos: many(contratosAlquiler),
  documentos: many(documentosAdquisicion),
  gastos: many(gastos),
  rentasNegativas: many(rentasNegativas),
}));

export const propiedadCopropietariosRelations = relations(propiedadCopropietarios, ({ one }) => ({
  propiedad: one(propiedades, {
    fields: [propiedadCopropietarios.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
  cliente: one(clientes, {
    fields: [propiedadCopropietarios.idCliente],
    references: [clientes.idCliente],
  }),
}));

export const declaraciones210Relations = relations(declaraciones210, ({ one, many }) => ({
  propiedad: one(propiedades, {
    fields: [declaraciones210.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
  cliente: one(clientes, {
    fields: [declaraciones210.idCliente],
    references: [clientes.idCliente],
  }),
  compensaciones: many(compensacionesRentasNegativas),
}));

export const contratosAlquilerRelations = relations(contratosAlquiler, ({ one, many }) => ({
  propiedad: one(propiedades, {
    fields: [contratosAlquiler.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
  pagos: many(pagosAlquiler),
}));

export const pagosAlquilerRelations = relations(pagosAlquiler, ({ one }) => ({
  contrato: one(contratosAlquiler, {
    fields: [pagosAlquiler.idContrato],
    references: [contratosAlquiler.idContrato],
  }),
}));

export const documentosAdquisicionRelations = relations(documentosAdquisicion, ({ one }) => ({
  propiedad: one(propiedades, {
    fields: [documentosAdquisicion.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
}));

export const gastosRelations = relations(gastos, ({ one }) => ({
  propiedad: one(propiedades, {
    fields: [gastos.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
}));

export const rentasNegativasRelations = relations(rentasNegativas, ({ one, many }) => ({
  propiedad: one(propiedades, {
    fields: [rentasNegativas.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
  cliente: one(clientes, {
    fields: [rentasNegativas.idCliente],
    references: [clientes.idCliente],
  }),
  compensaciones: many(compensacionesRentasNegativas),
}));

export const compensacionesRentasNegativasRelations = relations(compensacionesRentasNegativas, ({ one }) => ({
  rentaNegativa: one(rentasNegativas, {
    fields: [compensacionesRentasNegativas.idRentaNegativa],
    references: [rentasNegativas.idRentaNegativa],
  }),
  declaracion: one(declaraciones210, {
    fields: [compensacionesRentasNegativas.idDeclaracion],
    references: [declaraciones210.idDeclaracion],
  }),
}));

export const insertClienteSchema = createInsertSchema(clientes).omit({
  idCliente: true,
  activo: true,
  fechaAlta: true,
}).extend({
  nie: z.string().min(1, "NIE es requerido").max(12),
  nombre: z.string().min(1, "Nombre es requerido").max(100),
  apellidos: z.string().min(1, "Apellidos son requeridos").max(200),
  email: z.string().email("Email inválido").max(150),
  telefono: z.string().min(1, "Teléfono es requerido").max(20),
  ciudadPolonia: z.string().max(100).optional(),
  direccionPolonia: z.string().optional(),
  notas: z.string().optional(),
});

export const insertPropiedadSchema = createInsertSchema(propiedades).omit({
  idPropiedad: true,
  activa: true,
  fechaAlta: true,
}).extend({
  referenciaCatastral: z.string().min(1, "Referencia catastral es requerida").max(20),
  direccion: z.string().min(1, "Dirección es requerida").max(500),
  provincia: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  municipio: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  tipo: z.string().min(1, "Tipo es requerido"),
  tipoDeclaracion: z.enum(['imputacion', 'alquiler', 'mixta']),
  fechaCompra: z.string().min(1, "Fecha de compra es requerida"),
  precioCompra: z.string().min(1, "Precio de compra es requerido"),
  valorCatastralTotal: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  valorCatastralSuelo: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  valorCatastralConstruccion: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  notas: z.string().optional().or(z.literal('')).transform(val => val || undefined),
});

export const insertCopropietarioSchema = createInsertSchema(propiedadCopropietarios).omit({
  id: true,
  activo: true,
}).extend({
  porcentaje: z.string().min(1, "Porcentaje es requerido"),
  fechaInicio: z.string().min(1, "Fecha de inicio es requerida"),
});

export const insertDeclaracion210Schema = createInsertSchema(declaraciones210).omit({
  idDeclaracion: true,
  fechaCalculo: true,
  estado: true,
}).extend({
  ano: z.number().int().min(2020).max(2030),
  diasDeclarados: z.number().int().min(1).max(365),
  tipo: z.enum(['imputacion', 'alquiler', 'mixta']),
  modalidad: z.enum(['anual', 'trimestral']),
  valorCatastralBase: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  porcentajeAplicado: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  rentaImputada: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  ingresosAlquiler: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  gastosDeducibles: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  amortizacion: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  baseImponible: z.string().min(1, "Base imponible es requerida"),
  cuotaPagar: z.string().min(1, "Cuota a pagar es requerida"),
  porcentajeParticipacion: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  fechaPresentacion: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  usuarioCalculo: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  formulaAplicada: z.string().optional().or(z.literal('')).transform(val => val || undefined),
});

export const insertContratoAlquilerSchema = createInsertSchema(contratosAlquiler).omit({
  idContrato: true,
  fechaAlta: true,
}).extend({
  fechaInicio: z.string().min(1, "Fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "Fecha de fin es requerida"),
  rentaMensual: z.string().min(1, "Renta mensual es requerida"),
  diaPago: z.number().int().min(1).max(31).optional(),
  deposito: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  nombreInquilino: z.string().min(1, "Nombre del inquilino es requerido").max(200),
  apellidosInquilino: z.string().max(200).optional().or(z.literal('')).transform(val => val || undefined),
  dniNieInquilino: z.string().max(12).optional().or(z.literal('')).transform(val => val || undefined),
  emailInquilino: z.string().email("Email inválido").max(150).optional().or(z.literal('')).transform(val => val || undefined),
  telefonoInquilino: z.string().max(20).optional().or(z.literal('')).transform(val => val || undefined),
  formaPago: z.string().max(50).optional().or(z.literal('')).transform(val => val || undefined),
  rutaContratoPdf: z.string().max(500).optional().or(z.literal('')).transform(val => val || undefined),
  estado: z.enum(['activo', 'finalizado', 'cancelado', 'renovado']).optional(),
  motivoCancelacion: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  usuarioAlta: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  observaciones: z.string().optional().or(z.literal('')).transform(val => val || undefined),
}).refine((data) => {
  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);
  return fin >= inicio;
}, {
  message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
  path: ["fechaFin"],
});

export const insertPagoAlquilerSchema = createInsertSchema(pagosAlquiler).omit({
  idPago: true,
  fechaRegistro: true,
}).extend({
  fechaPago: z.string().min(1, "Fecha de pago es requerida"),
  mesCorrespondiente: z.number().int().min(1).max(12).optional(),
  anoCorrespondiente: z.number().int().min(2020).max(2030),
  importe: z.string().min(1, "Importe es requerido"),
  estado: z.enum(['pendiente', 'pagado', 'atrasado', 'impagado']).optional(),
  metodoPago: z.string().max(50).optional().or(z.literal('')).transform(val => val || undefined),
  referenciaBancaria: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  rutaJustificante: z.string().max(500).optional().or(z.literal('')).transform(val => val || undefined),
});

export const insertDocumentoAdquisicionSchema = createInsertSchema(documentosAdquisicion).omit({
  idDocumento: true,
  idPropiedad: true,
  fechaAlta: true,
  validado: true,
  fechaValidacion: true,
}).extend({
  tipo: z.enum([
    'precio_compra',
    'gastos_notario',
    'gastos_registro',
    'itp',
    'iva_compra',
    'gastos_biuro_compra',
    'gastos_agencia',
    'mejoras'
  ]),
  descripcion: z.string().min(1, "Descripción es requerida").max(500),
  importe: z.string().min(1, "Importe es requerido"),
  fechaDocumento: z.string().min(1, "Fecha del documento es requerida"),
  rutaArchivo: z.string().max(500).optional().or(z.literal('')).transform(val => val || undefined),
  usuarioAlta: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
});

export const insertGastoSchema = createInsertSchema(gastos).omit({
  idGasto: true,
  fechaRegistro: true,
  validado: true,
  fechaValidacion: true,
}).extend({
  tipoGasto: z.enum([
    'ibi',
    'comunidad',
    'seguro',
    'intereses_hipoteca',
    'suministros',
    'conservacion',
    'reparacion',
    'biuro',
    'agencia',
    'abogado',
    'publicidad',
    'otro'
  ]),
  descripcion: z.string().min(1, "Descripción es requerida").max(500),
  importe: z.string().min(1, "Importe es requerido"),
  fechaGasto: z.string().min(1, "Fecha del gasto es requerida"),
  fechaInicioPeriodo: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  fechaFinPeriodo: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  nombreProveedor: z.string().max(200).optional().or(z.literal('')).transform(val => val || undefined),
  numeroFactura: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  rutaFactura: z.string().max(500).optional().or(z.literal('')).transform(val => val || undefined),
  usuarioRegistro: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  observaciones: z.string().optional().or(z.literal('')).transform(val => val || undefined),
});

export const insertRentaNegativaSchema = createInsertSchema(rentasNegativas).omit({
  idRentaNegativa: true,
  importeCompensado: true,
  fechaCreacion: true,
}).extend({
  anoOrigen: z.number().int().min(2020).max(2035),
  importeNegativo: z.string().min(1, "Importe negativo es requerido"),
  concepto: z.enum(['reparaciones', 'intereses', 'mixto']),
  estado: z.enum(['pendiente', 'compensado', 'vencido']).optional(),
  observaciones: z.string().optional().or(z.literal('')).transform(val => val || undefined),
});

export const insertCompensacionRentaNegativaSchema = createInsertSchema(compensacionesRentasNegativas).omit({
  idCompensacion: true,
  fechaCompensacion: true,
}).extend({
  anoCompensacion: z.number().int().min(2020).max(2035),
  importeCompensado: z.string().min(1, "Importe compensado es requerido"),
  usuario: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
});

export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;

export type InsertPropiedad = z.infer<typeof insertPropiedadSchema>;
export type Propiedad = typeof propiedades.$inferSelect;

export type InsertCopropietario = z.infer<typeof insertCopropietarioSchema>;
export type Copropietario = typeof propiedadCopropietarios.$inferSelect;

export type InsertDeclaracion210 = z.infer<typeof insertDeclaracion210Schema>;
export type Declaracion210 = typeof declaraciones210.$inferSelect;

export type InsertContratoAlquiler = z.infer<typeof insertContratoAlquilerSchema>;
export type ContratoAlquiler = typeof contratosAlquiler.$inferSelect;

export type InsertPagoAlquiler = z.infer<typeof insertPagoAlquilerSchema>;
export type PagoAlquiler = typeof pagosAlquiler.$inferSelect;

export type InsertDocumentoAdquisicion = z.infer<typeof insertDocumentoAdquisicionSchema>;
export type DocumentoAdquisicion = typeof documentosAdquisicion.$inferSelect;

export type InsertGasto = z.infer<typeof insertGastoSchema>;
export type Gasto = typeof gastos.$inferSelect;

export type InsertRentaNegativa = z.infer<typeof insertRentaNegativaSchema>;
export type RentaNegativa = typeof rentasNegativas.$inferSelect;

export type InsertCompensacionRentaNegativa = z.infer<typeof insertCompensacionRentaNegativaSchema>;
export type CompensacionRentaNegativa = typeof compensacionesRentasNegativas.$inferSelect;
