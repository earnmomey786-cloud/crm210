import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ChevronLeft, Home, MapPin, Calendar, DollarSign, FileText, Users, Edit, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { NuevaPropiedadDialog } from "@/components/nueva-propiedad-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Propiedad, Cliente, Copropietario } from "@shared/schema";
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
        setCalculoModelo({
          ano: parseInt(ano),
          dias: parseInt(dias),
          baseImponible: primeraDeclaracion.baseImponible,
          tipoImpositivo: primeraDeclaracion.tipoImpositivo,
          importeAPagar: primeraDeclaracion.cuotaPagar,
          formula: primeraDeclaracion.formula,
          detalles: {
            valorCatastral: propiedad?.valorCatastralTotal ? parseFloat(propiedad.valorCatastralTotal) : 0,
            porcentajeImputacion: porcentajeAplicado ? parseFloat(porcentajeAplicado) : 0,
            porcentajePropiedad: primeraDeclaracion.porcentajeParticipacion,
            rentaImputada: primeraDeclaracion.rentaImputada,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 rounded-2xl lg:col-span-2 space-y-8" data-testid="card-info-propiedad">
            <div>
              <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Información General
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Propietario</p>
                  <p className="font-medium text-card-foreground" data-testid="text-propietario">
                    {cliente.nombre} {cliente.apellidos}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">NIE</p>
                  <p className="font-medium text-card-foreground font-mono" data-testid="text-propietario-nie">
                    {cliente.nie}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Referencia Catastral</p>
                  <p className="font-medium text-card-foreground font-mono text-sm" data-testid="text-ref-catastral">
                    {propiedad.referenciaCatastral}
                  </p>
                </div>
                {propiedad.provincia && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Provincia</p>
                    <p className="font-medium text-card-foreground" data-testid="text-provincia">{propiedad.provincia}</p>
                  </div>
                )}
                {propiedad.municipio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Municipio</p>
                    <p className="font-medium text-card-foreground" data-testid="text-municipio">{propiedad.municipio}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Datos de Compra
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fecha de Compra
                  </p>
                  <p className="font-medium text-card-foreground">
                    {formatDate(propiedad.fechaCompra)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Precio de Compra</p>
                  <p className="font-medium text-card-foreground text-lg">
                    {formatCurrency(propiedad.precioCompra)}
                  </p>
                </div>
              </div>
            </div>

            {(propiedad.valorCatastralTotal || propiedad.valorCatastralSuelo || propiedad.valorCatastralConstruccion) && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">
                  Valores Catastrales (IBI)
                </h2>
                <div className="space-y-3">
                  {propiedad.valorCatastralTotal && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium text-card-foreground">Valor Total</span>
                      <span className="font-semibold text-card-foreground">
                        {formatCurrency(propiedad.valorCatastralTotal)}
                      </span>
                    </div>
                  )}
                  {propiedad.valorCatastralSuelo && (
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Valor del Suelo</span>
                      <span className="font-medium text-card-foreground">
                        {formatCurrency(propiedad.valorCatastralSuelo)}
                      </span>
                    </div>
                  )}
                  {propiedad.valorCatastralConstruccion && (
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Valor de la Construcción</span>
                      <span className="font-medium text-card-foreground">
                        {formatCurrency(propiedad.valorCatastralConstruccion)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {propiedad.notas && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-card-foreground mb-3">
                  Notas
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {propiedad.notas}
                </p>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                Tipo de Declaración
              </h2>
              <RadioGroup value={propiedad.tipoDeclaracion} disabled>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <RadioGroupItem value="imputacion" id="imputacion" data-testid="radio-imputacion" />
                    <Label htmlFor="imputacion" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium text-card-foreground">Imputación</p>
                        <p className="text-xs text-muted-foreground">Vacía o uso propio</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg">
                    <RadioGroupItem value="alquiler" id="alquiler" data-testid="radio-alquiler" />
                    <Label htmlFor="alquiler" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium text-card-foreground">Alquiler</p>
                        <p className="text-xs text-muted-foreground">Propiedad alquilada</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg">
                    <RadioGroupItem value="mixta" id="mixta" data-testid="radio-mixta" />
                    <Label htmlFor="mixta" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium text-card-foreground">Mixta</p>
                        <p className="text-xs text-muted-foreground">Parte año alquilada</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            <Card className="p-6 rounded-2xl" data-testid="card-copropietarios">
              <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Copropietarios
              </h2>
              {loadingCopropietarios ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !copropietarios || copropietarios.length === 0 ? (
                <div className="text-center py-4" data-testid="copropietario-unico">
                  <p className="text-sm text-muted-foreground mb-3" data-testid="text-propietario-unico">
                    Propiedad 100% de {cliente.nombre}
                  </p>
                  <div className="relative">
                    <Progress value={100} className="h-2" />
                    <span className="absolute -top-6 right-0 text-xs font-semibold text-primary">
                      100%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {copropietarios.map((cop) => (
                    <div 
                      key={cop.id} 
                      className="p-3 bg-muted/30 rounded-lg"
                      data-testid={`copropietario-${cop.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-card-foreground text-sm" data-testid={`text-copropietario-nombre-${cop.id}`}>
                          {cop.cliente?.nombre} {cop.cliente?.apellidos}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className="rounded-full font-semibold"
                          data-testid={`badge-porcentaje-${cop.id}`}
                        >
                          {cop.porcentaje}%
                        </Badge>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={parseFloat(cop.porcentaje)} 
                          className="h-2"
                          data-testid={`progress-copropietario-${cop.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {propiedad.tipoDeclaracion === 'imputacion' && (
              <>
                <Card className="p-6 rounded-2xl" data-testid="card-calcular-declaracion">
                  <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Calcular y Guardar Declaración
                  </h2>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      calcularModelo210Mutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ano" className="text-sm font-medium text-card-foreground">
                          Año Fiscal
                        </Label>
                        <Input
                          id="ano"
                          type="number"
                          value={ano}
                          onChange={(e) => setAno(e.target.value)}
                          min="2000"
                          max="2100"
                          required
                          data-testid="input-ano"
                          className="rounded-lg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dias" className="text-sm font-medium text-card-foreground">
                          Días (máx. 366)
                        </Label>
                        <Input
                          id="dias"
                          type="number"
                          value={dias}
                          onChange={(e) => setDias(e.target.value)}
                          min="1"
                          max="366"
                          required
                          data-testid="input-dias"
                          className="rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="porcentaje" className="text-sm font-medium text-card-foreground">
                        % Aplicado (opcional, deja vacío para cálculo automático)
                      </Label>
                      <Input
                        id="porcentaje"
                        type="number"
                        value={porcentajeAplicado}
                        onChange={(e) => setPorcentajeAplicado(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Ej: 1.1 o 2.0"
                        data-testid="input-porcentaje"
                        className="rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Déjalo en blanco para usar el porcentaje automático basado en la fecha de revisión catastral
                      </p>
                    </div>

                    <Button 
                      type="submit"
                      disabled={calcularModelo210Mutation.isPending || !propiedad.valorCatastralTotal}
                      variant="default" 
                      className="w-full rounded-lg h-12 text-base font-semibold shadow-md"
                      data-testid="button-calcular-modelo"
                    >
                      {calcularModelo210Mutation.isPending ? (
                        <>Guardando...</>
                      ) : (
                        <>
                          <Calculator className="w-5 h-5 mr-2" />
                          Calcular y Guardar
                        </>
                      )}
                    </Button>
                  </form>
                </Card>

                {calculoModelo && (
                  <Card className="p-6 rounded-2xl" data-testid="card-resultado-modelo210">
                    <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      Último Resultado Calculado
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <p className="text-sm text-muted-foreground mb-1">Importe a Pagar</p>
                        <p className="text-3xl font-bold text-primary" data-testid="text-importe-pagar">
                          {formatEuros(calculoModelo.importeAPagar)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Base Imponible</p>
                          <p className="text-lg font-semibold text-card-foreground" data-testid="text-base-imponible">
                            {formatEuros(calculoModelo.baseImponible)}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Tipo Impositivo</p>
                          <p className="text-lg font-semibold text-card-foreground" data-testid="text-tipo-impositivo">
                            {calculoModelo.tipoImpositivo}%
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <p className="text-sm font-semibold text-card-foreground mb-3">Detalles del Cálculo</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Año:</span>
                            <span className="font-medium">{calculoModelo.ano}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Días:</span>
                            <span className="font-medium">{calculoModelo.dias}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor Catastral:</span>
                            <span className="font-medium">{formatEuros(calculoModelo.detalles.valorCatastral)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Renta Imputada:</span>
                            <span className="font-medium">{formatEuros(calculoModelo.detalles.rentaImputada)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">% Propiedad:</span>
                            <span className="font-medium">{formatPercentage(calculoModelo.detalles.porcentajePropiedad)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground font-mono bg-muted/30 p-3 rounded-lg">
                          {calculoModelo.formula}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

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
