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

  app.post('/api/propiedades/:id/calcular-imputacion', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const { ano, dias, porcentajeAplicado } = req.body;

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      if (propiedad.tipoDeclaracion !== 'imputacion') {
        return res.status(400).json({ 
          message: 'Este endpoint solo funciona para propiedades de imputación' 
        });
      }

      // Validar datos requeridos
      if (!propiedad.valorCatastralTotal || propiedad.valorCatastralTotal.trim() === '') {
        return res.status(400).json({ 
          message: 'La propiedad debe tener un valor catastral total' 
        });
      }

      if (!propiedad.fechaCompra || propiedad.fechaCompra.trim() === '') {
        return res.status(400).json({ 
          message: 'La propiedad debe tener una fecha de compra' 
        });
      }

      // Obtener copropietarios
      const copropietarios = await storage.getCopropietariosByPropiedad(propiedadId);
      
      // Si no hay copropietarios, crear declaración para el propietario principal
      const propietarios = copropietarios.length > 0 
        ? copropietarios.map(c => ({
            idCliente: c.idCliente,
            porcentaje: parseFloat(c.porcentaje),
          }))
        : [{ idCliente: propiedad.idCliente, porcentaje: 100 }];

      const declaraciones = [];
      
      for (const propietario of propietarios) {
        // Calcular Modelo 210 para este propietario
        const resultado = calcularModelo210Imputacion({
          valorCatastralTotal: propiedad.valorCatastralTotal,
          fechaCompra: propiedad.fechaCompra,
          tipoPropiedad: propiedad.tipo as any,
          porcentajePropiedad: propietario.porcentaje,
          ano,
          dias,
          porcentajeAplicado,
        });

        // Guardar declaración en la base de datos
        const declaracion = await storage.createDeclaracion210({
          idPropiedad: propiedadId,
          idCliente: propietario.idCliente,
          ano: resultado.ano,
          trimestre: undefined,
          tipo: 'imputacion',
          modalidad: 'anual',
          diasDeclarados: resultado.dias,
          valorCatastralBase: propiedad.valorCatastralTotal,
          porcentajeAplicado: resultado.detalles.porcentajeImputacion.toFixed(4),
          rentaImputada: resultado.detalles.rentaImputada.toFixed(2),
          ingresosAlquiler: undefined,
          gastosDeducibles: undefined,
          amortizacion: undefined,
          baseImponible: resultado.baseImponible.toFixed(2),
          cuotaPagar: resultado.importeAPagar.toFixed(2),
          porcentajeParticipacion: propietario.porcentaje.toFixed(2),
          fechaPresentacion: undefined,
          usuarioCalculo: undefined,
          formulaAplicada: resultado.formula,
        });

        declaraciones.push({
          idDeclaracion: declaracion.idDeclaracion,
          idCliente: propietario.idCliente,
          porcentajeParticipacion: propietario.porcentaje,
          rentaImputada: resultado.detalles.rentaImputada,
          baseImponible: resultado.baseImponible,
          tipoImpositivo: resultado.tipoImpositivo,
          cuotaPagar: resultado.importeAPagar,
          formula: resultado.formula,
        });
      }

      res.status(201).json({
        propiedad: {
          id: propiedadId,
          direccion: propiedad.direccion,
        },
        declaraciones,
      });
    } catch (error: any) {
      console.error('Error al calcular y guardar declaración:', error);
      
      if (error.message && (
        error.message.includes('inválido') || 
        error.message.includes('faltante') ||
        error.message.includes('obligatoria') ||
        error.message.includes('debe ser')
      )) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al calcular y guardar declaración' });
    }
  });

  app.get('/api/clientes/:id/declaraciones', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;

      const cliente = await storage.getCliente(clienteId);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      const declaraciones = await storage.getDeclaracionesByCliente(clienteId, ano);

      const totalCuota = declaraciones.reduce((sum, d) => {
        const cuota = parseFloat(d.cuotaPagar);
        return sum + (isNaN(cuota) ? 0 : cuota);
      }, 0);

      res.json({
        cliente: `${cliente.nombre} ${cliente.apellidos}`,
        ano: ano || 'Todos',
        declaraciones: declaraciones.map(d => ({
          idDeclaracion: d.idDeclaracion,
          propiedad: d.propiedad.direccion,
          tipo: d.tipo,
          modalidad: d.modalidad,
          ano: d.ano,
          cuotaPagar: parseFloat(d.cuotaPagar),
          estado: d.estado,
        })),
        totalCuota: Math.round(totalCuota * 100) / 100,
      });
    } catch (error: any) {
      console.error('Error al obtener declaraciones:', error);
      res.status(500).json({ message: 'Error al obtener declaraciones' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
