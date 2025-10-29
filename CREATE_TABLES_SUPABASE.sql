-- SQL para crear todas las tablas en Supabase
-- Ejecuta este script completo en el SQL Editor de Supabase

CREATE TABLE "clientes" (
	"id_cliente" serial PRIMARY KEY NOT NULL,
	"nie" varchar(12) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellidos" varchar(200) NOT NULL,
	"email" varchar(150) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"ciudad_polonia" varchar(100),
	"direccion_polonia" text,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_alta" timestamp DEFAULT now() NOT NULL,
	"notas" text,
	CONSTRAINT "clientes_nie_unique" UNIQUE("nie"),
	CONSTRAINT "clientes_email_unique" UNIQUE("email")
);

CREATE TABLE "compensaciones_rentas_negativas" (
	"id_compensacion" serial PRIMARY KEY NOT NULL,
	"id_renta_negativa" integer NOT NULL,
	"id_declaracion" integer NOT NULL,
	"ano_compensacion" integer NOT NULL,
	"importe_compensado" numeric(12, 2) NOT NULL,
	"fecha_compensacion" timestamp DEFAULT now() NOT NULL,
	"usuario" varchar(100)
);

CREATE TABLE "contratos_alquiler" (
	"id_contrato" serial PRIMARY KEY NOT NULL,
	"id_propiedad" integer NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"renta_mensual" numeric(10, 2) NOT NULL,
	"forma_pago" varchar(50),
	"dia_pago" integer,
	"deposito" numeric(10, 2),
	"nombre_inquilino" varchar(200) NOT NULL,
	"apellidos_inquilino" varchar(200),
	"dni_nie_inquilino" varchar(12),
	"email_inquilino" varchar(150),
	"telefono_inquilino" varchar(20),
	"ruta_contrato_pdf" varchar(500),
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"motivo_cancelacion" text,
	"fecha_alta" timestamp DEFAULT now() NOT NULL,
	"usuario_alta" varchar(100),
	"observaciones" text
);

CREATE TABLE "declaraciones_210" (
	"id_declaracion" serial PRIMARY KEY NOT NULL,
	"id_propiedad" integer NOT NULL,
	"id_cliente" integer NOT NULL,
	"ano" integer NOT NULL,
	"trimestre" integer,
	"tipo" varchar(20) NOT NULL,
	"modalidad" varchar(20) NOT NULL,
	"dias_declarados" integer NOT NULL,
	"valor_catastral_base" numeric(12, 2),
	"porcentaje_aplicado" numeric(5, 4),
	"renta_imputada" numeric(12, 2),
	"ingresos_alquiler" numeric(12, 2),
	"gastos_deducibles" numeric(12, 2),
	"amortizacion" numeric(12, 2),
	"valor_total_adquisicion" numeric(12, 2),
	"valor_amortizable" numeric(12, 2),
	"amortizacion_anual_propiedad" numeric(12, 2),
	"amortizacion_proporcional_dias" numeric(12, 2),
	"amortizacion_propietario" numeric(12, 2),
	"base_imponible" numeric(12, 2) NOT NULL,
	"cuota_pagar" numeric(12, 2) NOT NULL,
	"porcentaje_participacion" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"estado" varchar(20) DEFAULT 'borrador' NOT NULL,
	"fecha_presentacion" date,
	"fecha_calculo" timestamp DEFAULT now() NOT NULL,
	"usuario_calculo" varchar(100),
	"formula_aplicada" text
);

CREATE TABLE "documentos_adquisicion" (
	"id_documento" serial PRIMARY KEY NOT NULL,
	"id_propiedad" integer NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"descripcion" varchar(500) NOT NULL,
	"importe" numeric(12, 2) NOT NULL,
	"fecha_documento" date NOT NULL,
	"ruta_archivo" varchar(500),
	"validado" boolean DEFAULT false NOT NULL,
	"fecha_validacion" timestamp,
	"fecha_alta" timestamp DEFAULT now() NOT NULL,
	"usuario_alta" varchar(100)
);

CREATE TABLE "gastos" (
	"id_gasto" serial PRIMARY KEY NOT NULL,
	"id_propiedad" integer NOT NULL,
	"tipo_gasto" varchar(50) NOT NULL,
	"es_proporcional" boolean GENERATED ALWAYS AS (tipo_gasto IN ('ibi', 'comunidad', 'seguro', 'intereses_hipoteca', 'suministros', 'conservacion')) STORED,
	"genera_renta_negativa" boolean GENERATED ALWAYS AS (tipo_gasto IN ('reparacion', 'intereses_hipoteca')) STORED,
	"descripcion" varchar(500) NOT NULL,
	"importe" numeric(10, 2) NOT NULL,
	"fecha_gasto" date NOT NULL,
	"fecha_inicio_periodo" date,
	"fecha_fin_periodo" date,
	"nombre_proveedor" varchar(200),
	"numero_factura" varchar(100),
	"ruta_factura" varchar(500),
	"validado" boolean DEFAULT false NOT NULL,
	"fecha_validacion" timestamp,
	"fecha_registro" timestamp DEFAULT now() NOT NULL,
	"usuario_registro" varchar(100),
	"observaciones" text
);

CREATE TABLE "pagos_alquiler" (
	"id_pago" serial PRIMARY KEY NOT NULL,
	"id_contrato" integer NOT NULL,
	"fecha_pago" date NOT NULL,
	"mes_correspondiente" integer,
	"ano_correspondiente" integer NOT NULL,
	"importe" numeric(10, 2) NOT NULL,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"metodo_pago" varchar(50),
	"referencia_bancaria" varchar(100),
	"ruta_justificante" varchar(500),
	"fecha_registro" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "propiedad_copropietarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_propiedad" integer NOT NULL,
	"id_cliente" integer NOT NULL,
	"porcentaje" numeric(5, 2) NOT NULL,
	"fecha_inicio" date NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);

CREATE TABLE "propiedades" (
	"id_propiedad" serial PRIMARY KEY NOT NULL,
	"id_cliente" integer NOT NULL,
	"referencia_catastral" varchar(20) NOT NULL,
	"direccion" varchar(500) NOT NULL,
	"provincia" varchar(100),
	"municipio" varchar(100),
	"tipo" varchar(50) NOT NULL,
	"tipo_declaracion" varchar(20) DEFAULT 'imputacion' NOT NULL,
	"fecha_compra" date NOT NULL,
	"precio_compra" numeric(12, 2) NOT NULL,
	"valor_catastral_total" numeric(12, 2),
	"valor_catastral_suelo" numeric(12, 2),
	"valor_catastral_construccion" numeric(12, 2),
	"valor_total_adquisicion" numeric(12, 2),
	"porcentaje_construccion" numeric(5, 4),
	"valor_amortizable" numeric(12, 2),
	"amortizacion_anual" numeric(12, 2),
	"activa" boolean DEFAULT true NOT NULL,
	"fecha_alta" timestamp DEFAULT now() NOT NULL,
	"notas" text,
	CONSTRAINT "propiedades_referencia_catastral_unique" UNIQUE("referencia_catastral")
);

CREATE TABLE "rentas_negativas" (
	"id_renta_negativa" serial PRIMARY KEY NOT NULL,
	"id_propiedad" integer NOT NULL,
	"id_cliente" integer NOT NULL,
	"ano_origen" integer NOT NULL,
	"importe_negativo" numeric(12, 2) NOT NULL,
	"concepto" varchar(50) NOT NULL,
	"importe_compensado" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"importe_pendiente" numeric(12, 2) GENERATED ALWAYS AS (importe_negativo - importe_compensado) STORED,
	"ano_limite" integer GENERATED ALWAYS AS (ano_origen + 4) STORED,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	"observaciones" text
);

-- Foreign Keys
ALTER TABLE "compensaciones_rentas_negativas" ADD CONSTRAINT "compensaciones_rentas_negativas_id_renta_negativa_rentas_negativas_id_renta_negativa_fk" FOREIGN KEY ("id_renta_negativa") REFERENCES "public"."rentas_negativas"("id_renta_negativa") ON DELETE no action ON UPDATE no action;
ALTER TABLE "compensaciones_rentas_negativas" ADD CONSTRAINT "compensaciones_rentas_negativas_id_declaracion_declaraciones_210_id_declaracion_fk" FOREIGN KEY ("id_declaracion") REFERENCES "public"."declaraciones_210"("id_declaracion") ON DELETE no action ON UPDATE no action;
ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_id_propiedad_propiedades_id_propiedad_fk" FOREIGN KEY ("id_propiedad") REFERENCES "public"."propiedades"("id_propiedad") ON DELETE no action ON UPDATE no action;
ALTER TABLE "declaraciones_210" ADD CONSTRAINT "declaraciones_210_id_propiedad_propiedades_id_propiedad_fk" FOREIGN KEY ("id_propiedad") REFERENCES "public"."propiedades"("id_propiedad") ON DELETE no action ON UPDATE no action;
ALTER TABLE "declaraciones_210" ADD CONSTRAINT "declaraciones_210_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE no action ON UPDATE no action;
ALTER TABLE "documentos_adquisicion" ADD CONSTRAINT "documentos_adquisicion_id_propiedad_propiedades_id_propiedad_fk" FOREIGN KEY ("id_propiedad") REFERENCES "public"."propiedades"("id_propiedad") ON DELETE no action ON UPDATE no action;
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_propiedad_propiedades_id_propiedad_fk" FOREIGN KEY ("id_propiedad") REFERENCES "public"."propiedades"("id_propiedad") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pagos_alquiler" ADD CONSTRAINT "pagos_alquiler_id_contrato_contratos_alquiler_id_contrato_fk" FOREIGN KEY ("id_contrato") REFERENCES "public"."contratos_alquiler"("id_contrato") ON DELETE no action ON UPDATE no action;
ALTER TABLE "propiedad_copropietarios" ADD CONSTRAINT "propiedad_copropietarios_id_propiedad_propiedades_id_propiedad_fk" FOREIGN KEY ("id_propiedad") REFERENCES "public"."propiedades"("id_propiedad") ON DELETE no action ON UPDATE no action;
ALTER TABLE "propiedad_copropietarios" ADD CONSTRAINT "propiedad_copropietarios_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE no action ON UPDATE no action;
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE no action ON UPDATE no action;
ALTER TABLE "rentas_negativas" ADD CONSTRAINT "rentas_negativas_id_propiedad_propiedades_id_propiedad_fk" FOREIGN KEY ("id_propiedad") REFERENCES "public"."propiedades"("id_propiedad") ON DELETE no action ON UPDATE no action;
ALTER TABLE "rentas_negativas" ADD CONSTRAINT "rentas_negativas_id_cliente_clientes_id_cliente_fk" FOREIGN KEY ("id_cliente") REFERENCES "public"."clientes"("id_cliente") ON DELETE no action ON UPDATE no action;

-- Indexes
CREATE INDEX "idx_nie" ON "clientes" USING btree ("nie");
CREATE INDEX "idx_nombre" ON "clientes" USING btree ("nombre");
CREATE INDEX "idx_comp_rn" ON "compensaciones_rentas_negativas" USING btree ("id_renta_negativa");
CREATE INDEX "idx_comp_decl" ON "compensaciones_rentas_negativas" USING btree ("id_declaracion");
CREATE INDEX "idx_contrato_propiedad" ON "contratos_alquiler" USING btree ("id_propiedad");
CREATE INDEX "idx_contrato_fechas" ON "contratos_alquiler" USING btree ("fecha_inicio","fecha_fin");
CREATE INDEX "idx_contrato_estado" ON "contratos_alquiler" USING btree ("estado");
CREATE INDEX "idx_contrato_inquilino" ON "contratos_alquiler" USING btree ("nombre_inquilino");
CREATE INDEX "idx_decl_propiedad" ON "declaraciones_210" USING btree ("id_propiedad");
CREATE INDEX "idx_decl_cliente" ON "declaraciones_210" USING btree ("id_cliente");
CREATE INDEX "idx_decl_ano" ON "declaraciones_210" USING btree ("ano");
CREATE INDEX "idx_decl_tipo" ON "declaraciones_210" USING btree ("tipo");
CREATE INDEX "idx_doc_adq_propiedad" ON "documentos_adquisicion" USING btree ("id_propiedad");
CREATE INDEX "idx_doc_adq_tipo" ON "documentos_adquisicion" USING btree ("tipo");
CREATE INDEX "idx_gasto_propiedad" ON "gastos" USING btree ("id_propiedad");
CREATE INDEX "idx_gasto_tipo" ON "gastos" USING btree ("tipo_gasto");
CREATE INDEX "idx_gasto_fecha" ON "gastos" USING btree ("fecha_gasto");
CREATE INDEX "idx_gasto_validado" ON "gastos" USING btree ("validado");
CREATE INDEX "idx_pago_contrato" ON "pagos_alquiler" USING btree ("id_contrato");
CREATE INDEX "idx_pago_fecha" ON "pagos_alquiler" USING btree ("fecha_pago");
CREATE INDEX "idx_pago_estado" ON "pagos_alquiler" USING btree ("estado");
CREATE INDEX "idx_propiedad_cop" ON "propiedad_copropietarios" USING btree ("id_propiedad");
CREATE INDEX "idx_cliente" ON "propiedades" USING btree ("id_cliente");
CREATE INDEX "idx_tipo_declaracion" ON "propiedades" USING btree ("tipo_declaracion");
CREATE INDEX "idx_rn_propiedad" ON "rentas_negativas" USING btree ("id_propiedad");
CREATE INDEX "idx_rn_cliente" ON "rentas_negativas" USING btree ("id_cliente");
CREATE INDEX "idx_rn_ano" ON "rentas_negativas" USING btree ("ano_origen");
CREATE INDEX "idx_rn_estado" ON "rentas_negativas" USING btree ("estado");
