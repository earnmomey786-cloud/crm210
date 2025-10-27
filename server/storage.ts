import { 
  clientes, 
  propiedades, 
  propiedadCopropietarios,
  type Cliente, 
  type InsertCliente,
  type Propiedad,
  type InsertPropiedad,
  type Copropietario,
  type InsertCopropietario,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getCliente(id: number): Promise<Cliente | undefined>;
  getClientes(): Promise<Cliente[]>;
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
}

export class DatabaseStorage implements IStorage {
  async getCliente(id: number): Promise<Cliente | undefined> {
    const [cliente] = await db.select().from(clientes).where(eq(clientes.idCliente, id));
    return cliente || undefined;
  }

  async getClientes(): Promise<Cliente[]> {
    return await db.select().from(clientes).where(eq(clientes.activo, true));
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
}

export const storage = new DatabaseStorage();
