import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClienteSchema, insertPropiedadSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { calcularModelo210Imputacion } from "@shared/modelo210-calc";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/api/clientes', async (req, res) => {
    try {
      const searchQuery = req.query.q as string | undefined;
      
      if (searchQuery) {
        const clientes = await storage.searchClientes(searchQuery);
        return res.json(clientes);
      }
      
      const clientes = await storage.getClientes();
      res.json(clientes);
    } catch (error: any) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({ message: 'Error al obtener clientes' });
    }
  });

  app.get('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id);
      
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      
      res.json(cliente);
    } catch (error: any) {
      console.error('Error al obtener cliente:', error);
      res.status(500).json({ message: 'Error al obtener cliente' });
    }
  });

  app.post('/api/clientes', async (req, res) => {
    try {
      const validation = insertClienteSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const cliente = await storage.createCliente(validation.data);
      res.status(201).json(cliente);
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ 
          message: 'El NIE o email ya existe en el sistema' 
        });
      }
      
      res.status(500).json({ message: 'Error al crear cliente' });
    }
  });

  app.put('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertClienteSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const cliente = await storage.updateCliente(id, validation.data);
      
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      
      res.json(cliente);
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
      
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ 
          message: 'El NIE o email ya existe en el sistema' 
        });
      }
      
      res.status(500).json({ message: 'Error al actualizar cliente' });
    }
  });

  app.delete('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCliente(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      res.status(500).json({ message: 'Error al eliminar cliente' });
    }
  });

  app.get('/api/clientes/:id/propiedades', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      const propiedades = await storage.getPropiedadesByCliente(clienteId);
      res.json(propiedades);
    } catch (error: any) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ message: 'Error al obtener propiedades' });
    }
  });

  app.post('/api/clientes/:id/propiedades', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      
      const cliente = await storage.getCliente(clienteId);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      const propiedadData = {
        ...req.body,
        idCliente: clienteId,
      };

      const validation = insertPropiedadSchema.safeParse(propiedadData);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const propiedad = await storage.createPropiedad(validation.data);
      res.status(201).json(propiedad);
    } catch (error: any) {
      console.error('Error al crear propiedad:', error);
      
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ 
          message: 'La referencia catastral ya existe en el sistema' 
        });
      }
      
      res.status(500).json({ message: 'Error al crear propiedad' });
    }
  });

  app.get('/api/propiedades/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const propiedad = await storage.getPropiedad(id);
      
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }
      
      res.json(propiedad);
    } catch (error: any) {
      console.error('Error al obtener propiedad:', error);
      res.status(500).json({ message: 'Error al obtener propiedad' });
    }
  });

  app.put('/api/propiedades/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertPropiedadSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const propiedad = await storage.updatePropiedad(id, validation.data);
      
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }
      
      res.json(propiedad);
    } catch (error: any) {
      console.error('Error al actualizar propiedad:', error);
      
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ 
          message: 'La referencia catastral ya existe en el sistema' 
        });
      }
      
      res.status(500).json({ message: 'Error al actualizar propiedad' });
    }
  });

  app.delete('/api/propiedades/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePropiedad(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error al eliminar propiedad:', error);
      res.status(500).json({ message: 'Error al eliminar propiedad' });
    }
  });

  app.get('/api/propiedades/:id/copropietarios', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const copropietarios = await storage.getCopropietariosByPropiedad(propiedadId);
      res.json(copropietarios);
    } catch (error: any) {
      console.error('Error al obtener copropietarios:', error);
      res.status(500).json({ message: 'Error al obtener copropietarios' });
    }
  });

  app.post('/api/propiedades/:id/copropietarios', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      
      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const { copropietarios } = req.body;

      if (!Array.isArray(copropietarios) || copropietarios.length === 0) {
        return res.status(400).json({ 
          message: 'Debes proporcionar un array de copropietarios' 
        });
      }

      await storage.createCopropietarios(propiedadId, copropietarios);
      res.status(201).json({ message: 'Copropietarios creados exitosamente' });
    } catch (error: any) {
      console.error('Error al crear copropietarios:', error);
      
      if (error.message?.includes('porcentaje')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al crear copropietarios' });
    }
  });

  app.delete('/api/propiedades/:id/copropietarios/:clienteId', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const clienteId = parseInt(req.params.clienteId);
      
      await storage.deleteCopropietario(propiedadId, clienteId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error al eliminar copropietario:', error);
      res.status(500).json({ message: 'Error al eliminar copropietario' });
    }
  });

  app.get('/api/propiedades/:id/modelo210', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      
      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      if (propiedad.tipoDeclaracion !== 'imputacion') {
        return res.status(400).json({ 
          message: 'El cálculo automático solo está disponible para propiedades de imputación' 
        });
      }

      // Validar datos requeridos
      if (!propiedad.valorCatastralTotal || propiedad.valorCatastralTotal.trim() === '') {
        return res.status(400).json({ 
          message: 'La propiedad debe tener un valor catastral total para calcular el Modelo 210' 
        });
      }

      if (!propiedad.fechaCompra || propiedad.fechaCompra.trim() === '') {
        return res.status(400).json({ 
          message: 'La propiedad debe tener una fecha de compra para calcular el Modelo 210' 
        });
      }

      // Obtener copropietarios para calcular el porcentaje de propiedad
      const copropietarios = await storage.getCopropietariosByPropiedad(propiedadId);
      let porcentajePropiedad = 100;
      
      if (copropietarios.length > 0) {
        // Si hay copropietarios, buscar el porcentaje del propietario principal
        const copropietarioPrincipal = copropietarios.find(c => c.idCliente === propiedad.idCliente);
        if (copropietarioPrincipal && copropietarioPrincipal.porcentaje) {
          const porcentajeStr = copropietarioPrincipal.porcentaje;
          const porcentajeParsed = parseFloat(porcentajeStr);
          if (!isNaN(porcentajeParsed) && porcentajeParsed > 0 && porcentajeParsed <= 100) {
            porcentajePropiedad = porcentajeParsed;
          }
        }
      }

      const resultado = calcularModelo210Imputacion({
        valorCatastralTotal: propiedad.valorCatastralTotal,
        fechaCompra: propiedad.fechaCompra,
        tipoPropiedad: propiedad.tipo as any,
        porcentajePropiedad,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error('Error al calcular Modelo 210:', error);
      
      // Si es un error de validación, devolver 400
      if (error.message && (
        error.message.includes('inválido') || 
        error.message.includes('faltante') ||
        error.message.includes('obligatoria')
      )) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al calcular Modelo 210' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
