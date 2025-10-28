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

export const clientesRelations = relations(clientes, ({ many }) => ({
  propiedades: many(propiedades),
  copropiedades: many(propiedadCopropietarios),
  declaraciones: many(declaraciones210),
}));

export const propiedadesRelations = relations(propiedades, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [propiedades.idCliente],
    references: [clientes.idCliente],
  }),
  copropietarios: many(propiedadCopropietarios),
  declaraciones: many(declaraciones210),
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

export const declaraciones210Relations = relations(declaraciones210, ({ one }) => ({
  propiedad: one(propiedades, {
    fields: [declaraciones210.idPropiedad],
    references: [propiedades.idPropiedad],
  }),
  cliente: one(clientes, {
    fields: [declaraciones210.idCliente],
    references: [clientes.idCliente],
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

export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;

export type InsertPropiedad = z.infer<typeof insertPropiedadSchema>;
export type Propiedad = typeof propiedades.$inferSelect;

export type InsertCopropietario = z.infer<typeof insertCopropietarioSchema>;
export type Copropietario = typeof propiedadCopropietarios.$inferSelect;

export type InsertDeclaracion210 = z.infer<typeof insertDeclaracion210Schema>;
export type Declaracion210 = typeof declaraciones210.$inferSelect;
