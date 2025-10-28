import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ChevronLeft, Home, MapPin, Calendar, DollarSign, FileText, Users, Edit, Calculator, TrendingDown, Plus, RefreshCw, AlertCircle, Info, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NuevaPropiedadDialog } from "@/components/nueva-propiedad-dialog";
import { DatosGeneralesTab } from "@/components/propiedad/DatosGeneralesTab";
import { AdquisicionTab } from "@/components/propiedad/AdquisicionTab";
import { GastosTab } from "@/components/propiedad/GastosTab";
import { ContratosTab } from "@/components/propiedad/ContratosTab";
import { CalculosTab } from "@/components/propiedad/CalculosTab";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Propiedad, Cliente, Copropietario, DocumentoAdquisicion } from "@shared/schema";
import type { Modelo210ImputacionResult } from "@shared/modelo210-calc";
import { formatEuros, formatPercentage } from "@shared/modelo210-calc";

interface DeclaracionGuardada {
  idDeclaracion: number;
  idCliente: number;
  porcentajeParticipacion: number;
  rentaImputada: number;
  baseImponible: number;
  tipoImpositivo: number;
  cuotaPagar: number;
  formula: string;
}

interface ResultadoCalculo {
  propiedad: {
    id: number;
    direccion: string;
  };
  declaraciones: DeclaracionGuardada[];
}

export default function PropiedadDetalle() {
  const params = useParams();
  const [, navigate] = useLocation();
  const propiedadId = parseInt(params.id || "0");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [calculoModelo, setCalculoModelo] = useState<Modelo210ImputacionResult | null>(null);
  const currentYear = new Date().getFullYear();
  const [ano, setAno] = useState(currentYear.toString());
  const [dias, setDias] = useState("365");
  const [porcentajeAplicado, setPorcentajeAplicado] = useState("");
  const [resultadoAmortizacion, setResultadoAmortizacion] = useState<any>(null);
  
  const { toast } = useToast();

  const { data: propiedad, isLoading: loadingPropiedad } = useQuery<Propiedad>({
    queryKey: ['/api/propiedades', propiedadId],
  });

  const { data: cliente, isLoading: loadingCliente } = useQuery<Cliente>({
    queryKey: ['/api/clientes', propiedad?.idCliente],
    enabled: !!propiedad?.idCliente,
  });

  const { data: copropietarios, isLoading: loadingCopropietarios} = useQuery<Array<Copropietario & { cliente: Cliente }>>({
    queryKey: ['/api/propiedades', propiedadId, 'copropietarios'],
  });

  const { data: documentos, isLoading: loadingDocumentos } = useQuery<DocumentoAdquisicion[]>({
    queryKey: ['/api/propiedades', propiedadId, 'documentos-adquisicion'],
  });

  const calcularModelo210Mutation = useMutation({
    mutationFn: async () => {
      const anoNum = parseInt(ano);
      const diasNum = parseInt(dias);
      const porcentajeNum = porcentajeAplicado ? parseFloat(porcentajeAplicado) : undefined;

      if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
        throw new Error('El año debe estar entre 2000 y 2100');
      }
      if (isNaN(diasNum) || diasNum < 1 || diasNum > 366) {
        throw new Error('Los días deben estar entre 1 y 366');
      }
      if (porcentajeNum !== undefined && (isNaN(porcentajeNum) || porcentajeNum < 0 || porcentajeNum > 100)) {
        throw new Error('El porcentaje debe estar entre 0 y 100');
      }

      const response = await apiRequest(
        'POST',
        `/api/propiedades/${propiedadId}/calcular-imputacion`,
        { 
          ano: anoNum, 
          dias: diasNum,
          porcentajeAplicado: porcentajeNum
        }
      );
      
      return await response.json();
    },
    onSuccess: (data: ResultadoCalculo) => {
      // Mostrar los detalles del cálculo de la primera declaración (propietario principal)
      if (data.declaraciones.length > 0) {
        const primeraDeclaracion = data.declaraciones[0];
        const valorCat = propiedad?.valorCatastralTotal ? parseFloat(propiedad.valorCatastralTotal) : 0;
        const porcImputacion = porcentajeAplicado ? parseFloat(porcentajeAplicado) : 0;
        const rentaImp = primeraDeclaracion.rentaImputada;
        const baseCompleta = rentaImp;
        const baseProporcional = primeraDeclaracion.baseImponible;

        setCalculoModelo({
          ano: parseInt(ano),
          dias: parseInt(dias),
          baseImponible: primeraDeclaracion.baseImponible,
          tipoImpositivo: primeraDeclaracion.tipoImpositivo,
          importeAPagar: primeraDeclaracion.cuotaPagar,
          cuotaIntegra: primeraDeclaracion.cuotaPagar,
          formula: primeraDeclaracion.formula,
          detalles: {
            valorCatastral: valorCat,
            porcentajeImputacion: porcImputacion,
            porcentajePropiedad: primeraDeclaracion.porcentajeParticipacion,
            baseImponibleCompleta: baseCompleta,
            baseImponibleProporcional: baseProporcional,
            rentaImputada: rentaImp,
          }
        });
      }

      // Invalidar queries para refrescar el historial
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clientes', propiedad?.idCliente, 'declaraciones'] 
      });

      toast({
        title: "Declaración guardada",
        description: `Se guardaron ${data.declaraciones.length} declaración(es) correctamente.`,
      });
      
      // Resetear formulario
      setAno(currentYear.toString());
      setDias("365");
      setPorcentajeAplicado("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al calcular",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const agregarDocumentoMutation = useMutation({
    mutationFn: async (data: { tipo: string; descripcion: string; importe: number; fechaDocumento: string }) => {
      const response = await apiRequest(
        'POST',
        `/api/propiedades/${propiedadId}/documentos-adquisicion`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/propiedades', propiedadId, 'documentos-adquisicion'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/propiedades', propiedadId],
      });
      toast({
        title: "Documento agregado",
        description: "El documento de adquisición se agregó correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al agregar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calcularValorAmortizableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/propiedades/${propiedadId}/calcular-valor-amortizable`,
        {}
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/propiedades', propiedadId],
      });
      toast({
        title: "Valor amortizable calculado",
        description: "El valor amortizable se ha calculado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al calcular",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calcularAmortizacionMutation = useMutation({
    mutationFn: async (params: { ano: number; dias: number; porcentaje: number }) => {
      const response = await apiRequest(
        'POST',
        `/api/propiedades/${propiedadId}/calcular-amortizacion`,
        params
      );
      return await response.json();
    },
    onSuccess: (data) => {
      setResultadoAmortizacion(data);
      queryClient.invalidateQueries({
        queryKey: ['/api/propiedades', propiedadId],
      });
      toast({
        title: "Amortización calculada",
        description: `Amortización prorrateada calculada correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al calcular",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTipoDeclaracionColor = (tipo: string) => {
    switch (tipo) {
      case 'imputacion':
        // Soft pink pastel
        return 'bg-[hsl(var(--chart-3))] text-[hsl(var(--destructive-foreground))]';
      case 'alquiler':
        // Soft mint green pastel
        return 'bg-[hsl(var(--chart-2))] text-[hsl(var(--accent-foreground))]';
      case 'mixta':
        // Soft yellow/cream pastel
        return 'bg-[hsl(var(--chart-4))] text-[hsl(215_12%_40%)]';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      precio_compra: "Precio de Compra",
      gastos_notario: "Gastos de Notaría",
      gastos_registro: "Gastos de Registro",
      itp: "ITP (Impuesto de Transmisiones)",
      iva_compra: "IVA de Compra",
      gastos_biuro_compra: "Gastos de Gestoría",
      gastos_agencia: "Gastos de Agencia",
      mejoras: "Mejoras",
    };
    return labels[tipo] || tipo;
  };

  const tiposDocumento = [
    { value: "precio_compra", label: "Precio de Compra" },
    { value: "gastos_notario", label: "Gastos de Notaría" },
    { value: "gastos_registro", label: "Gastos de Registro" },
    { value: "itp", label: "ITP (Impuesto de Transmisiones)" },
    { value: "iva_compra", label: "IVA de Compra" },
    { value: "gastos_biuro_compra", label: "Gastos de Gestoría" },
    { value: "gastos_agencia", label: "Gastos de Agencia" },
    { value: "mejoras", label: "Mejoras" },
  ];

  if (loadingPropiedad || loadingCliente) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!propiedad || !cliente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Propiedad no encontrada</h2>
          <Button onClick={() => navigate("/")}>
            Volver a clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-8">
          <Link href={`/clientes/${cliente.idCliente}`}>
            <Button 
              variant="ghost" 
              className="mb-4 -ml-2 hover-elevate"
              data-testid="button-volver-propiedades"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Volver a propiedades de {cliente.nombre}
            </Button>
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground capitalize">
                    {propiedad.tipo}
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {propiedad.direccion}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setEditDialogOpen(true)}
              variant="outline" 
              className="rounded-lg"
              data-testid="button-editar-propiedad"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="datos" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="datos" className="flex items-center gap-2" data-testid="tab-datos-generales">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Datos Generales</span>
            </TabsTrigger>
            <TabsTrigger value="adquisicion" className="flex items-center gap-2" data-testid="tab-adquisicion">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Adquisición</span>
            </TabsTrigger>
            <TabsTrigger value="gastos" className="flex items-center gap-2" data-testid="tab-gastos">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Gastos</span>
            </TabsTrigger>
            <TabsTrigger value="contratos" className="flex items-center gap-2" data-testid="tab-contratos">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Contratos</span>
            </TabsTrigger>
            <TabsTrigger value="calculos" className="flex items-center gap-2" data-testid="tab-calculos">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Cálculos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos">
            <DatosGeneralesTab 
              propiedad={propiedad}
              cliente={cliente}
            />
          </TabsContent>

          <TabsContent value="adquisicion">
            <AdquisicionTab 
              propiedad={propiedad}
              documentos={documentos || []}
              onAddDocument={agregarDocumentoMutation.mutateAsync}
              onCalculateValorAmortizable={calcularValorAmortizableMutation.mutateAsync}
              onCalculateAmortizacion={calcularAmortizacionMutation.mutateAsync}
              isAddingDocument={agregarDocumentoMutation.isPending}
              isCalculatingValorAmortizable={calcularValorAmortizableMutation.isPending}
              isCalculatingAmortization={calcularAmortizacionMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="gastos">
            <GastosTab propiedadId={propiedadId} />
          </TabsContent>

          <TabsContent value="contratos">
            <ContratosTab propiedadTipo={propiedad.tipoDeclaracion} />
          </TabsContent>

          <TabsContent value="calculos">
            <CalculosTab 
              propiedad={propiedad}
              cliente={cliente}
              copropietarios={copropietarios || []}
              propietarioName={`${cliente.nombre} ${cliente.apellidos}`}
            />
          </TabsContent>
        </Tabs>

        <NuevaPropiedadDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          clienteId={cliente.idCliente}
          clienteNombre={`${cliente.nombre} ${cliente.apellidos}`}
          propiedad={propiedad}
        />
      </div>
    </div>
  );
}
