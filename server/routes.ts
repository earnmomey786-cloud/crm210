import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClienteSchema, insertPropiedadSchema, insertContratoAlquilerSchema, insertPagoAlquilerSchema, insertDocumentoAdquisicionSchema, insertGastoSchema, contratosAlquiler, pagosAlquiler, gastos } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { calcularModelo210Imputacion } from "@shared/modelo210-calc";
import { calcularDiasAlquilados } from "@shared/contratos-calc";
import { calcularValorAmortizable, calcularAmortizacion } from "@shared/amortizacion-calc";
import { calcularGastosDeducibles, verificarRentaNegativa } from "@shared/gastos-calc";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

const updateContratoSchema = createInsertSchema(contratosAlquiler).omit({
  idContrato: true,
  fechaAlta: true,
}).extend({
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  rentaMensual: z.string().optional(),
  diaPago: z.number().int().min(1).max(31).optional(),
  deposito: z.string().optional().or(z.literal('')).transform(val => val || undefined),
  nombreInquilino: z.string().max(200).optional(),
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
}).partial();

const updatePagoSchema = createInsertSchema(pagosAlquiler).omit({
  idPago: true,
  fechaRegistro: true,
}).extend({
  fechaPago: z.string().optional(),
  mesCorrespondiente: z.number().int().min(1).max(12).optional(),
  anoCorrespondiente: z.number().int().min(2020).max(2030).optional(),
  importe: z.string().optional(),
  estado: z.enum(['pendiente', 'pagado', 'atrasado', 'impagado']).optional(),
  metodoPago: z.string().max(50).optional().or(z.literal('')).transform(val => val || undefined),
  referenciaBancaria: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  rutaJustificante: z.string().max(500).optional().or(z.literal('')).transform(val => val || undefined),
}).partial();

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

  app.get('/api/propiedades/:id/contratos', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const incluirCancelados = req.query.incluirCancelados === 'true';

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const contratos = await storage.getContratosByPropiedad(propiedadId, incluirCancelados);
      res.json(contratos);
    } catch (error: any) {
      console.error('Error al obtener contratos:', error);
      res.status(500).json({ message: 'Error al obtener contratos' });
    }
  });

  app.post('/api/propiedades/:id/contratos', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const contratoData = {
        ...req.body,
        idPropiedad: propiedadId,
      };

      const validation = insertContratoAlquilerSchema.safeParse(contratoData);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const contrato = await storage.createContrato(validation.data);
      res.status(201).json(contrato);
    } catch (error: any) {
      console.error('Error al crear contrato:', error);
      res.status(500).json({ message: 'Error al crear contrato' });
    }
  });

  app.get('/api/contratos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contrato = await storage.getContrato(id);
      
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }
      
      res.json(contrato);
    } catch (error: any) {
      console.error('Error al obtener contrato:', error);
      res.status(500).json({ message: 'Error al obtener contrato' });
    }
  });

  app.put('/api/contratos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateContratoSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const contrato = await storage.updateContrato(id, validation.data);
      
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }
      
      res.json(contrato);
    } catch (error: any) {
      console.error('Error al actualizar contrato:', error);
      res.status(500).json({ message: 'Error al actualizar contrato' });
    }
  });

  app.put('/api/contratos/:id/cancelar', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { motivo } = req.body;

      if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
        return res.status(400).json({ 
          message: 'Debes proporcionar un motivo para cancelar el contrato' 
        });
      }

      const contrato = await storage.cancelarContrato(id, motivo);
      
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }
      
      res.json(contrato);
    } catch (error: any) {
      console.error('Error al cancelar contrato:', error);
      res.status(500).json({ message: 'Error al cancelar contrato' });
    }
  });

  app.get('/api/propiedades/:id/dias-alquilados', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;

      if (!ano) {
        return res.status(400).json({ 
          message: 'El parámetro año es obligatorio' 
        });
      }

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const contratos = await storage.getContratosByPropiedad(propiedadId, false);
      
      const resultado = calcularDiasAlquilados(contratos, ano);
      
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al calcular días alquilados:', error);
      
      if (error.message && error.message.includes('solapan')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al calcular días alquilados' });
    }
  });

  app.get('/api/contratos/:id/pagos', async (req, res) => {
    try {
      const contratoId = parseInt(req.params.id);
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;

      const contrato = await storage.getContrato(contratoId);
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      const pagos = await storage.getPagosByContrato(contratoId, ano);
      res.json(pagos);
    } catch (error: any) {
      console.error('Error al obtener pagos:', error);
      res.status(500).json({ message: 'Error al obtener pagos' });
    }
  });

  app.post('/api/contratos/:id/pagos', async (req, res) => {
    try {
      const contratoId = parseInt(req.params.id);

      const contrato = await storage.getContrato(contratoId);
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      const pagoData = {
        ...req.body,
        idContrato: contratoId,
      };

      const validation = insertPagoAlquilerSchema.safeParse(pagoData);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const pago = await storage.createPago(validation.data);
      res.status(201).json(pago);
    } catch (error: any) {
      console.error('Error al crear pago:', error);
      res.status(500).json({ message: 'Error al crear pago' });
    }
  });

  app.put('/api/pagos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updatePagoSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const pago = await storage.updatePago(id, validation.data);
      
      if (!pago) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }
      
      res.json(pago);
    } catch (error: any) {
      console.error('Error al actualizar pago:', error);
      res.status(500).json({ message: 'Error al actualizar pago' });
    }
  });

  app.get('/api/propiedades/:id/documentos-adquisicion', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const documentos = await storage.getDocumentosByPropiedad(propiedadId);
      
      const sumaTotal = documentos.reduce((sum, doc) => sum + parseFloat(doc.importe), 0);

      res.json({
        id_propiedad: propiedadId,
        documentos,
        total_documentos: documentos.length,
        suma_total: sumaTotal
      });
    } catch (error: any) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({ message: 'Error al obtener documentos' });
    }
  });

  app.post('/api/propiedades/:id/documentos-adquisicion', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const { documentos } = req.body;

      if (!Array.isArray(documentos) || documentos.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un documento' });
      }

      const validationErrors: string[] = [];
      for (let i = 0; i < documentos.length; i++) {
        const validation = insertDocumentoAdquisicionSchema.safeParse(documentos[i]);
        if (!validation.success) {
          const errorMessage = fromZodError(validation.error).toString();
          validationErrors.push(`Documento ${i + 1}: ${errorMessage}`);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: 'Errores de validación',
          errors: validationErrors 
        });
      }

      const documentosCreados = await storage.createDocumentos(propiedadId, documentos);
      
      const valorTotalAdquisicion = documentosCreados.reduce((sum, doc) => sum + parseFloat(doc.importe), 0);

      res.status(201).json({
        id_propiedad: propiedadId,
        documentos_registrados: documentosCreados.length,
        valor_total_adquisicion: valorTotalAdquisicion,
        mensaje: 'Documentos registrados correctamente'
      });
    } catch (error: any) {
      console.error('Error al registrar documentos:', error);
      res.status(500).json({ message: 'Error al registrar documentos' });
    }
  });

  app.post('/api/propiedades/:id/calcular-valor-amortizable', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const documentos = await storage.getDocumentosByPropiedad(propiedadId, true);

      const resultado = calcularValorAmortizable(propiedad, documentos);

      await storage.updatePropiedadAmortizacion(
        propiedadId,
        resultado.valor_total_adquisicion,
        resultado.valores_catastrales.porcentaje_construccion,
        resultado.valor_amortizable,
        resultado.amortizacion_anual
      );

      res.json(resultado);
    } catch (error: any) {
      console.error('Error al calcular valor amortizable:', error);
      
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al calcular valor amortizable' });
    }
  });

  app.post('/api/propiedades/:id/calcular-amortizacion', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const { ano } = req.body;

      if (!ano || typeof ano !== 'number') {
        return res.status(400).json({ message: 'Debe proporcionar el año' });
      }

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const contratos = await storage.getContratosByPropiedad(propiedadId);
      const diasResult = calcularDiasAlquilados(contratos, ano);

      const copropietariosData = await storage.getCopropietariosByPropiedad(propiedadId);
      
      const copropietarios = copropietariosData.map(cop => ({
        id_cliente: cop.idCliente,
        nombre: `${cop.cliente.nombre} ${cop.cliente.apellidos}`,
        porcentaje_participacion: parseFloat(cop.porcentaje)
      }));

      const resultado = calcularAmortizacion(
        propiedad,
        diasResult.totalDiasAlquilados,
        copropietarios,
        ano
      );

      res.json(resultado);
    } catch (error: any) {
      console.error('Error al calcular amortización:', error);
      
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al calcular amortización' });
    }
  });

  // Endpoints de gestión de gastos (Fase 1E)
  
  // 1. POST /api/propiedades/:id/gastos - Registrar gasto
  app.post('/api/propiedades/:id/gastos', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      
      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const validatedData = insertGastoSchema.parse({
        ...req.body,
        idPropiedad: propiedadId
      });

      const gasto = await storage.createGasto(validatedData);
      res.status(201).json(gasto);
    } catch (error: any) {
      console.error('Error al crear gasto:', error);
      
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: 'Error al crear gasto' });
    }
  });

  // 2. GET /api/propiedades/:id/gastos - Listar gastos
  app.get('/api/propiedades/:id/gastos', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      const soloValidados = req.query.soloValidados === 'true';
      
      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const gastos = await storage.getGastosByPropiedad(propiedadId, ano, soloValidados);
      res.json(gastos);
    } catch (error: any) {
      console.error('Error al obtener gastos:', error);
      res.status(500).json({ message: 'Error al obtener gastos' });
    }
  });

  // 3. POST /api/propiedades/:id/calcular-gastos-deducibles - Calcular gastos deducibles
  app.post('/api/propiedades/:id/calcular-gastos-deducibles', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const { ano } = req.body;

      if (!ano || typeof ano !== 'number') {
        return res.status(400).json({ message: 'Debe proporcionar el año' });
      }

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const gastosValidados = await storage.getGastosByPropiedad(propiedadId, ano, true);
      const contratos = await storage.getContratosByPropiedad(propiedadId);
      const diasResult = calcularDiasAlquilados(contratos, ano);

      const resultado = calcularGastosDeducibles(
        propiedadId,
        gastosValidados,
        diasResult.totalDiasAlquilados,
        ano
      );

      res.json(resultado);
    } catch (error: any) {
      console.error('Error al calcular gastos deducibles:', error);
      
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al calcular gastos deducibles' });
    }
  });

  // 4. POST /api/propiedades/:id/verificar-renta-negativa - Detectar renta negativa
  app.post('/api/propiedades/:id/verificar-renta-negativa', async (req, res) => {
    try {
      const propiedadId = parseInt(req.params.id);
      const { ano, idCliente } = req.body;

      if (!ano || typeof ano !== 'number') {
        return res.status(400).json({ message: 'Debe proporcionar el año' });
      }

      if (!idCliente || typeof idCliente !== 'number') {
        return res.status(400).json({ message: 'Debe proporcionar el ID del cliente' });
      }

      const propiedad = await storage.getPropiedad(propiedadId);
      if (!propiedad) {
        return res.status(404).json({ message: 'Propiedad no encontrada' });
      }

      const gastosValidados = await storage.getGastosByPropiedad(propiedadId, ano, true);
      const contratos = await storage.getContratosByPropiedad(propiedadId);
      const diasResult = calcularDiasAlquilados(contratos, ano);
      const gastosDeducibles = calcularGastosDeducibles(
        propiedadId,
        gastosValidados,
        diasResult.totalDiasAlquilados,
        ano
      );

      const pagos = [];
      for (const contrato of contratos) {
        const contratoActivo = contrato.estado === 'activo' || 
                               (contrato.fechaInicio <= `${ano}-12-31` && 
                                (!contrato.fechaFin || contrato.fechaFin >= `${ano}-01-01`));
        if (contratoActivo) {
          const pagosList = await storage.getPagosByContrato(contrato.idContrato, ano);
          pagos.push(...pagosList);
        }
      }

      const copropietariosData = await storage.getCopropietariosByPropiedad(propiedadId);
      const copropietario = copropietariosData.find(c => c.idCliente === idCliente);
      
      if (!copropietario) {
        return res.status(404).json({ message: 'Copropietario no encontrado en esta propiedad' });
      }

      const porcentajeParticipacion = parseFloat(copropietario.porcentaje);
      
      const totalIngresos = pagos.reduce((sum, pago) => {
        if (pago.estado === 'pagado') {
          return sum + parseFloat(pago.importe);
        }
        return sum;
      }, 0);

      const ingresosPropiedad = totalIngresos * (porcentajeParticipacion / 100);
      
      const amortizacionAnual = propiedad.amortizacionAnual 
        ? parseFloat(propiedad.amortizacionAnual) 
        : 0;

      const amortizacionPropiedad = diasResult.totalDiasAlquilados > 0 && amortizacionAnual > 0
        ? (amortizacionAnual * diasResult.totalDiasAlquilados / 365) * (porcentajeParticipacion / 100)
        : 0;

      const resultado = verificarRentaNegativa(
        ingresosPropiedad,
        gastosDeducibles.totalGastosDeducibles,
        amortizacionPropiedad,
        gastosValidados
      );

      if (resultado.tieneRentaNegativa && resultado.importeRentaNegativa > 0) {
        await storage.createRentaNegativa({
          idCliente,
          idPropiedad: propiedadId,
          anoOrigen: ano,
          importeNegativo: resultado.importeRentaNegativa.toFixed(2),
          concepto: resultado.concepto as "reparaciones" | "intereses" | "mixto",
          observaciones: resultado.observaciones,
          estado: 'pendiente'
        });
      }

      res.json(resultado);
    } catch (error: any) {
      console.error('Error al verificar renta negativa:', error);
      
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al verificar renta negativa' });
    }
  });

  // 5. GET /api/clientes/:id/rentas-negativas-pendientes - Listar rentas negativas pendientes
  app.get('/api/clientes/:id/rentas-negativas-pendientes', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      
      const cliente = await storage.getCliente(clienteId);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      const rentasNegativas = await storage.getRentasNegativasByCliente(clienteId, 'pendiente');
      res.json(rentasNegativas);
    } catch (error: any) {
      console.error('Error al obtener rentas negativas:', error);
      res.status(500).json({ message: 'Error al obtener rentas negativas' });
    }
  });

  // 6. POST /api/declaraciones/:id/aplicar-compensacion - Aplicar compensación
  app.post('/api/declaraciones/:id/aplicar-compensacion', async (req, res) => {
    try {
      const declaracionId = parseInt(req.params.id);
      const { idRentaNegativa, importeAplicado } = req.body;

      if (!idRentaNegativa || typeof idRentaNegativa !== 'number') {
        return res.status(400).json({ message: 'Debe proporcionar el ID de la renta negativa' });
      }

      if (!importeAplicado || typeof importeAplicado !== 'number' || importeAplicado <= 0) {
        return res.status(400).json({ message: 'Debe proporcionar un importe válido' });
      }

      const declaracion = await storage.getDeclaracionesByPropiedad(
        0, 
        undefined
      );
      
      const rentaNegativa = await storage.getRentaNegativa(idRentaNegativa);
      if (!rentaNegativa) {
        return res.status(404).json({ message: 'Renta negativa no encontrada' });
      }

      if (rentaNegativa.estado !== 'pendiente' && rentaNegativa.estado !== null) {
        return res.status(400).json({ message: 'La renta negativa no está pendiente de compensación' });
      }

      const importePendiente = rentaNegativa.importePendiente ? parseFloat(rentaNegativa.importePendiente) : 0;
      if (importeAplicado > importePendiente) {
        return res.status(400).json({ 
          message: `El importe a aplicar (${importeAplicado}€) excede el importe pendiente (${importePendiente}€)` 
        });
      }

      const anoActual = new Date().getFullYear();
      const compensacion = await storage.createCompensacion({
        idRentaNegativa,
        idDeclaracion: declaracionId,
        importeCompensado: importeAplicado.toFixed(2),
        anoCompensacion: anoActual
      });

      const nuevoEstado = (importePendiente - importeAplicado) <= 0.01 ? 'compensado' : 'pendiente';

      await storage.updateRentaNegativa(idRentaNegativa, {
        estado: nuevoEstado
      });

      const importePendienteActualizado = importePendiente - importeAplicado;

      res.json({
        compensacion,
        renta_negativa_actualizada: {
          id: idRentaNegativa,
          importe_pendiente: importePendienteActualizado,
          estado: nuevoEstado
        }
      });
    } catch (error: any) {
      console.error('Error al aplicar compensación:', error);
      
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Error al aplicar compensación' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
