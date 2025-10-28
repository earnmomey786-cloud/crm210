import { 
  clientes, 
  propiedades, 
  propiedadCopropietarios,
  declaraciones210,
  contratosAlquiler,
  pagosAlquiler,
  documentosAdquisicion,
  type Cliente, 
  type InsertCliente,
  type Propiedad,
  type InsertPropiedad,
  type Copropietario,
  type InsertCopropietario,
  type Declaracion210,
  type InsertDeclaracion210,
  type ContratoAlquiler,
  type InsertContratoAlquiler,
  type PagoAlquiler,
  type InsertPagoAlquiler,
  type DocumentoAdquisicion,
  type InsertDocumentoAdquisicion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, or, ilike } from "drizzle-orm";

export interface IStorage {
  getCliente(id: number): Promise<Cliente | undefined>;
  getClientes(): Promise<Cliente[]>;
  searchClientes(query: string): Promise<Cliente[]>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, cliente: Partial<InsertCliente>): Promise<Cliente | undefined>;
  deleteCliente(id: number): Promise<void>;

  getPropiedad(id: number): Promise<Propiedad | undefined>;
  getPropiedadesByCliente(clienteId: number): Promise<Propiedad[]>;
  createPropiedad(propiedad: InsertPropiedad): Promise<Propiedad>;
  updatePropiedad(id: number, propiedad: Partial<InsertPropiedad>): Promise<Propiedad | undefined>;
  deletePropiedad(id: number): Promise<void>;

  getCopropietariosByPropiedad(propiedadId: number): Promise<Array<Copropietario & { cliente: Cliente }>>;
  createCopropietarios(propiedadId: number, copropietariosData: Array<{ idCliente: number; porcentaje: string; fechaInicio: string }>): Promise<void>;
  deleteCopropietario(propiedadId: number, clienteId: number): Promise<void>;

  createDeclaracion210(declaracion: InsertDeclaracion210): Promise<Declaracion210>;
  getDeclaracionesByCliente(clienteId: number, ano?: number): Promise<Array<Declaracion210 & { propiedad: Propiedad }>>;
  getDeclaracionesByPropiedad(propiedadId: number, ano?: number): Promise<Declaracion210[]>;

  getContrato(id: number): Promise<ContratoAlquiler | undefined>;
  getContratosByPropiedad(propiedadId: number, incluirCancelados?: boolean): Promise<ContratoAlquiler[]>;
  createContrato(contrato: InsertContratoAlquiler): Promise<ContratoAlquiler>;
  updateContrato(id: number, contrato: Partial<InsertContratoAlquiler>): Promise<ContratoAlquiler | undefined>;
  cancelarContrato(id: number, motivo: string): Promise<ContratoAlquiler | undefined>;

  getPago(id: number): Promise<PagoAlquiler | undefined>;
  getPagosByContrato(contratoId: number, ano?: number): Promise<PagoAlquiler[]>;
  createPago(pago: InsertPagoAlquiler): Promise<PagoAlquiler>;
  updatePago(id: number, pago: Partial<InsertPagoAlquiler>): Promise<PagoAlquiler | undefined>;

  getDocumentoAdquisicion(id: number): Promise<DocumentoAdquisicion | undefined>;
  getDocumentosByPropiedad(propiedadId: number, soloValidados?: boolean): Promise<DocumentoAdquisicion[]>;
  createDocumentos(propiedadId: number, documentos: InsertDocumentoAdquisicion[]): Promise<DocumentoAdquisicion[]>;
  updateDocumento(id: number, documento: Partial<InsertDocumentoAdquisicion>): Promise<DocumentoAdquisicion | undefined>;
  validarDocumento(id: number): Promise<DocumentoAdquisicion | undefined>;
  deleteDocumento(id: number): Promise<void>;
  updatePropiedadAmortizacion(
    propiedadId: number, 
    valorTotal: number, 
    porcentajeConstruccion: number, 
    valorAmortizable: number, 
    amortizacionAnual: number
  ): Promise<Propiedad | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getCliente(id: number): Promise<Cliente | undefined> {
    const [cliente] = await db.select().from(clientes).where(eq(clientes.idCliente, id));
    return cliente || undefined;
  }

  async getClientes(): Promise<Cliente[]> {
    return await db.select().from(clientes).where(eq(clientes.activo, true));
  }

  async searchClientes(query: string): Promise<Cliente[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(clientes).where(
      and(
        eq(clientes.activo, true),
        or(
          ilike(clientes.nie, searchPattern),
          ilike(clientes.nombre, searchPattern),
          ilike(clientes.apellidos, searchPattern)
        )
      )
    );
  }

  async createCliente(insertCliente: InsertCliente): Promise<Cliente> {
    const [cliente] = await db
      .insert(clientes)
      .values(insertCliente)
      .returning();
    return cliente;
  }

  async updateCliente(id: number, insertCliente: Partial<InsertCliente>): Promise<Cliente | undefined> {
    const [cliente] = await db
      .update(clientes)
      .set(insertCliente)
      .where(eq(clientes.idCliente, id))
      .returning();
    return cliente || undefined;
  }

  async deleteCliente(id: number): Promise<void> {
    await db
      .update(clientes)
      .set({ activo: false })
      .where(eq(clientes.idCliente, id));
  }

  async getPropiedad(id: number): Promise<Propiedad | undefined> {
    const [propiedad] = await db.select().from(propiedades).where(eq(propiedades.idPropiedad, id));
    return propiedad || undefined;
  }

  async getPropiedadesByCliente(clienteId: number): Promise<Propiedad[]> {
    return await db.select().from(propiedades).where(
      and(
        eq(propiedades.idCliente, clienteId),
        eq(propiedades.activa, true)
      )
    );
  }

  async createPropiedad(insertPropiedad: InsertPropiedad): Promise<Propiedad> {
    const [propiedad] = await db
      .insert(propiedades)
      .values(insertPropiedad)
      .returning();
    return propiedad;
  }

  async updatePropiedad(id: number, insertPropiedad: Partial<InsertPropiedad>): Promise<Propiedad | undefined> {
    const [propiedad] = await db
      .update(propiedades)
      .set(insertPropiedad)
      .where(eq(propiedades.idPropiedad, id))
      .returning();
    return propiedad || undefined;
  }

  async deletePropiedad(id: number): Promise<void> {
    await db
      .update(propiedades)
      .set({ activa: false })
      .where(eq(propiedades.idPropiedad, id));
  }

  async getCopropietariosByPropiedad(propiedadId: number): Promise<Array<Copropietario & { cliente: Cliente }>> {
    const results = await db
      .select({
        copropietario: propiedadCopropietarios,
        cliente: clientes,
      })
      .from(propiedadCopropietarios)
      .innerJoin(clientes, eq(propiedadCopropietarios.idCliente, clientes.idCliente))
      .where(
        and(
          eq(propiedadCopropietarios.idPropiedad, propiedadId),
          eq(propiedadCopropietarios.activo, true)
        )
      );

    return results.map(r => ({
      ...r.copropietario,
      cliente: r.cliente,
    }));
  }

  async createCopropietarios(
    propiedadId: number, 
    copropietariosData: Array<{ idCliente: number; porcentaje: string; fechaInicio: string }>
  ): Promise<void> {
    const totalPorcentaje = copropietariosData.reduce((sum, c) => sum + parseFloat(c.porcentaje), 0);
    
    if (totalPorcentaje > 100) {
      throw new Error(`La suma de porcentajes es ${totalPorcentaje}%. Debe ser máximo 100%`);
    }

    await db.insert(propiedadCopropietarios).values(
      copropietariosData.map(c => ({
        idPropiedad: propiedadId,
        idCliente: c.idCliente,
        porcentaje: c.porcentaje,
        fechaInicio: c.fechaInicio,
      }))
    );
  }

  async deleteCopropietario(propiedadId: number, clienteId: number): Promise<void> {
    await db
      .update(propiedadCopropietarios)
      .set({ activo: false })
      .where(
        and(
          eq(propiedadCopropietarios.idPropiedad, propiedadId),
          eq(propiedadCopropietarios.idCliente, clienteId)
        )
      );
  }

  async createDeclaracion210(insertDeclaracion: InsertDeclaracion210): Promise<Declaracion210> {
    const [declaracion] = await db
      .insert(declaraciones210)
      .values(insertDeclaracion)
      .returning();
    return declaracion;
  }

  async getDeclaracionesByCliente(clienteId: number, ano?: number): Promise<Array<Declaracion210 & { propiedad: Propiedad }>> {
    const whereConditions = ano 
      ? and(
          eq(declaraciones210.idCliente, clienteId),
          eq(declaraciones210.ano, ano)
        )
      : eq(declaraciones210.idCliente, clienteId);

    const results = await db
      .select({
        declaracion: declaraciones210,
        propiedad: propiedades,
      })
      .from(declaraciones210)
      .innerJoin(propiedades, eq(declaraciones210.idPropiedad, propiedades.idPropiedad))
      .where(whereConditions)
      .orderBy(sql`${declaraciones210.fechaCalculo} DESC`);

    return results.map(r => ({
      ...r.declaracion,
      propiedad: r.propiedad,
    }));
  }

  async getDeclaracionesByPropiedad(propiedadId: number, ano?: number): Promise<Declaracion210[]> {
    const whereConditions = ano
      ? and(
          eq(declaraciones210.idPropiedad, propiedadId),
          eq(declaraciones210.ano, ano)
        )
      : eq(declaraciones210.idPropiedad, propiedadId);

    return await db
      .select()
      .from(declaraciones210)
      .where(whereConditions)
      .orderBy(sql`${declaraciones210.fechaCalculo} DESC`);
  }

  async getContrato(id: number): Promise<ContratoAlquiler | undefined> {
    const [contrato] = await db.select().from(contratosAlquiler).where(eq(contratosAlquiler.idContrato, id));
    return contrato || undefined;
  }

  async getContratosByPropiedad(propiedadId: number, incluirCancelados: boolean = false): Promise<ContratoAlquiler[]> {
    const whereConditions = incluirCancelados
      ? eq(contratosAlquiler.idPropiedad, propiedadId)
      : and(
          eq(contratosAlquiler.idPropiedad, propiedadId),
          sql`${contratosAlquiler.estado} != 'cancelado'`
        );

    return await db
      .select()
      .from(contratosAlquiler)
      .where(whereConditions)
      .orderBy(sql`${contratosAlquiler.fechaInicio} DESC`);
  }

  async createContrato(insertContrato: InsertContratoAlquiler): Promise<ContratoAlquiler> {
    const [contrato] = await db
      .insert(contratosAlquiler)
      .values(insertContrato)
      .returning();
    return contrato;
  }

  async updateContrato(id: number, insertContrato: Partial<InsertContratoAlquiler>): Promise<ContratoAlquiler | undefined> {
    const [contrato] = await db
      .update(contratosAlquiler)
      .set(insertContrato)
      .where(eq(contratosAlquiler.idContrato, id))
      .returning();
    return contrato || undefined;
  }

  async cancelarContrato(id: number, motivo: string): Promise<ContratoAlquiler | undefined> {
    const [contrato] = await db
      .update(contratosAlquiler)
      .set({ 
        estado: 'cancelado',
        motivoCancelacion: motivo 
      })
      .where(eq(contratosAlquiler.idContrato, id))
      .returning();
    return contrato || undefined;
  }

  async getPago(id: number): Promise<PagoAlquiler | undefined> {
    const [pago] = await db.select().from(pagosAlquiler).where(eq(pagosAlquiler.idPago, id));
    return pago || undefined;
  }

  async getPagosByContrato(contratoId: number, ano?: number): Promise<PagoAlquiler[]> {
    const whereConditions = ano
      ? and(
          eq(pagosAlquiler.idContrato, contratoId),
          eq(pagosAlquiler.anoCorrespondiente, ano)
        )
      : eq(pagosAlquiler.idContrato, contratoId);

    return await db
      .select()
      .from(pagosAlquiler)
      .where(whereConditions)
      .orderBy(sql`${pagosAlquiler.fechaPago} DESC`);
  }

  async createPago(insertPago: InsertPagoAlquiler): Promise<PagoAlquiler> {
    const [pago] = await db
      .insert(pagosAlquiler)
      .values(insertPago)
      .returning();
    return pago;
  }

  async updatePago(id: number, insertPago: Partial<InsertPagoAlquiler>): Promise<PagoAlquiler | undefined> {
    const [pago] = await db
      .update(pagosAlquiler)
      .set(insertPago)
      .where(eq(pagosAlquiler.idPago, id))
      .returning();
    return pago || undefined;
  }

  async getDocumentoAdquisicion(id: number): Promise<DocumentoAdquisicion | undefined> {
    const [documento] = await db.select().from(documentosAdquisicion).where(eq(documentosAdquisicion.idDocumento, id));
    return documento || undefined;
  }

  async getDocumentosByPropiedad(propiedadId: number, soloValidados: boolean = false): Promise<DocumentoAdquisicion[]> {
    const whereConditions = soloValidados
      ? and(
          eq(documentosAdquisicion.idPropiedad, propiedadId),
          eq(documentosAdquisicion.validado, true)
        )
      : eq(documentosAdquisicion.idPropiedad, propiedadId);

    return await db
      .select()
      .from(documentosAdquisicion)
      .where(whereConditions)
      .orderBy(sql`${documentosAdquisicion.fechaDocumento} DESC`);
  }

  async createDocumentos(propiedadId: number, documentos: InsertDocumentoAdquisicion[]): Promise<DocumentoAdquisicion[]> {
    const documentosConPropiedad = documentos.map(doc => ({
      ...doc,
      idPropiedad: propiedadId,
      validado: true
    }));

    const result = await db
      .insert(documentosAdquisicion)
      .values(documentosConPropiedad)
      .returning();
    
    return result;
  }

  async updateDocumento(id: number, insertDocumento: Partial<InsertDocumentoAdquisicion>): Promise<DocumentoAdquisicion | undefined> {
    const [documento] = await db
      .update(documentosAdquisicion)
      .set(insertDocumento)
      .where(eq(documentosAdquisicion.idDocumento, id))
      .returning();
    return documento || undefined;
  }

  async validarDocumento(id: number): Promise<DocumentoAdquisicion | undefined> {
    const [documento] = await db
      .update(documentosAdquisicion)
      .set({ 
        validado: true,
        fechaValidacion: sql`NOW()`
      })
      .where(eq(documentosAdquisicion.idDocumento, id))
      .returning();
    return documento || undefined;
  }

  async deleteDocumento(id: number): Promise<void> {
    await db
      .delete(documentosAdquisicion)
      .where(eq(documentosAdquisicion.idDocumento, id));
  }

  async updatePropiedadAmortizacion(
    propiedadId: number,
    valorTotal: number,
    porcentajeConstruccion: number,
    valorAmortizable: number,
    amortizacionAnual: number
  ): Promise<Propiedad | undefined> {
    const [propiedad] = await db
      .update(propiedades)
      .set({
        valorTotalAdquisicion: valorTotal.toFixed(2),
        porcentajeConstruccion: porcentajeConstruccion.toFixed(4),
        valorAmortizable: valorAmortizable.toFixed(2),
        amortizacionAnual: amortizacionAnual.toFixed(2)
      })
      .where(eq(propiedades.idPropiedad, propiedadId))
      .returning();
    return propiedad || undefined;
  }
}

export const storage = new DatabaseStorage();
