import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ChevronLeft, Plus, Building2, Home, MapPin, Edit, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NuevaPropiedadDialog } from "@/components/nueva-propiedad-dialog";
import { NuevoClienteDialog } from "@/components/nuevo-cliente-dialog";
import type { Cliente, Propiedad } from "@shared/schema";

interface Declaracion {
  idDeclaracion: number;
  propiedad: string;
  tipo: string;
  modalidad: string;
  ano: number;
  cuotaPagar: number;
  estado: string | null;
}

interface DeclaracionesResponse {
  cliente: string;
  ano: string | number;
  declaraciones: Declaracion[];
  totalCuota: number;
}

export default function ClientePropiedades() {
  const params = useParams();
  const [, navigate] = useLocation();
  const clienteId = parseInt(params.id || "0");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClienteDialogOpen, setEditClienteDialogOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { data: cliente, isLoading: loadingCliente } = useQuery<Cliente>({
    queryKey: ['/api/clientes', clienteId],
  });

  const { data: propiedades, isLoading: loadingPropiedades } = useQuery<Propiedad[]>({
    queryKey: ['/api/clientes', clienteId, 'propiedades'],
  });

  const { data: declaraciones, isLoading: loadingDeclaraciones } = useQuery<DeclaracionesResponse>({
    queryKey: ['/api/clientes', clienteId, 'declaraciones', selectedYear === "all" ? undefined : selectedYear],
    enabled: !!clienteId,
  });

  const propiedadesActivas = propiedades?.filter(p => p.activa) || [];

  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

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

  const getTipoDeclaracionLabel = (tipo: string) => {
    switch (tipo) {
      case 'imputacion':
        return 'Imputación';
      case 'alquiler':
        return 'Alquiler';
      case 'mixta':
        return 'Mixta';
      default:
        return tipo;
    }
  };

  if (loadingCliente) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-32 w-full mb-8" />
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Cliente no encontrado</h2>
          <Button onClick={() => navigate("/")}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button 
              variant="ghost" 
              className="mb-4 -ml-2 hover-elevate"
              data-testid="button-volver-clientes"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Volver a clientes
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {cliente.nombre} {cliente.apellidos}
              </h1>
              <p className="text-muted-foreground">
                NIE: <span className="font-mono font-medium">{cliente.nie}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setEditClienteDialogOpen(true)}
                variant="outline"
                className="rounded-lg"
                data-testid="button-editar-cliente"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Cliente
              </Button>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="rounded-lg shadow-md"
                data-testid="button-nueva-propiedad"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Propiedad
              </Button>
            </div>
          </div>

          <Card className="p-6 rounded-2xl mb-8" data-testid="card-info-cliente">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-card-foreground" data-testid="text-cliente-email">{cliente.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                <p className="font-medium text-card-foreground" data-testid="text-cliente-telefono">{cliente.telefono}</p>
              </div>
              {cliente.ciudadPolonia && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ciudad (Polonia)</p>
                  <p className="font-medium text-card-foreground" data-testid="text-cliente-ciudad">{cliente.ciudadPolonia}</p>
                </div>
              )}
            </div>
            {cliente.direccionPolonia && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Dirección en Polonia</p>
                <p className="font-medium text-card-foreground" data-testid="text-cliente-direccion-polonia">{cliente.direccionPolonia}</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Propiedades en España
          </h2>

          {loadingPropiedades ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6 rounded-2xl">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : propiedadesActivas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Building2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay propiedades
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Agrega la primera propiedad de {cliente.nombre} en España
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                variant="default"
                className="rounded-lg"
                data-testid="button-nueva-propiedad-empty"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Propiedad
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {propiedadesActivas.map(propiedad => (
                <Link 
                  key={propiedad.idPropiedad} 
                  href={`/propiedades/${propiedad.idPropiedad}`}
                  data-testid={`link-propiedad-${propiedad.idPropiedad}`}
                >
                  <Card 
                    className="p-6 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer hover-elevate active-elevate-2 group"
                    data-testid={`card-propiedad-${propiedad.idPropiedad}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-card-foreground capitalize" data-testid={`text-tipo-${propiedad.idPropiedad}`}>
                            {propiedad.tipo}
                          </h3>
                        </div>
                        <div className="flex items-start gap-2 text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm" data-testid={`text-direccion-${propiedad.idPropiedad}`}>
                            {propiedad.direccion}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {propiedad.provincia && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Provincia:</span> <span data-testid={`text-provincia-${propiedad.idPropiedad}`}>{propiedad.provincia}</span>
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Ref. Catastral:</span>{" "}
                        <span className="font-mono text-xs" data-testid={`text-ref-catastral-${propiedad.idPropiedad}`}>{propiedad.referenciaCatastral}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <Badge 
                        className={`rounded-full px-3 py-1 text-xs font-semibold border ${getTipoDeclaracionColor(propiedad.tipoDeclaracion)}`}
                        data-testid={`badge-tipo-${propiedad.idPropiedad}`}
                      >
                        {getTipoDeclaracionLabel(propiedad.tipoDeclaracion)}
                      </Badge>
                      <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors" data-testid={`link-text-ver-detalles-${propiedad.idPropiedad}`}>
                        Ver detalles →
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Historial de Declaraciones
            </h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[150px] rounded-lg" data-testid="select-year">
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-year-all">Todos los años</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem 
                      key={year} 
                      value={year.toString()}
                      data-testid={`select-year-${year}`}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingDeclaraciones ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : !declaraciones || declaraciones.declaraciones.length === 0 ? (
            <Card className="p-8 rounded-2xl" data-testid="card-no-declaraciones">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No hay declaraciones
                </h3>
                <p className="text-muted-foreground">
                  {selectedYear === "all" 
                    ? "Aún no se han calculado declaraciones para este cliente"
                    : `No hay declaraciones para el año ${selectedYear}`}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {declaraciones.declaraciones.map((declaracion) => (
                  <Card 
                    key={declaracion.idDeclaracion} 
                    className="p-4 rounded-2xl hover-elevate"
                    data-testid={`card-declaracion-${declaracion.idDeclaracion}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-card-foreground" data-testid={`text-propiedad-${declaracion.idDeclaracion}`}>
                            {declaracion.propiedad}
                          </h4>
                          <Badge 
                            className={`rounded-full px-2 py-0.5 text-xs ${getTipoDeclaracionColor(declaracion.tipo)}`}
                            data-testid={`badge-tipo-${declaracion.idDeclaracion}`}
                          >
                            {getTipoDeclaracionLabel(declaracion.tipo)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span data-testid={`text-ano-${declaracion.idDeclaracion}`}>
                            Año: <span className="font-medium text-card-foreground">{declaracion.ano}</span>
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span data-testid={`text-modalidad-${declaracion.idDeclaracion}`}>
                            {declaracion.modalidad === 'anual' ? 'Anual' : 'Trimestral'}
                          </span>
                          {declaracion.estado && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span data-testid={`text-estado-${declaracion.idDeclaracion}`}>
                                {declaracion.estado}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Cuota a pagar</p>
                        <p className="text-xl font-bold text-primary" data-testid={`text-cuota-${declaracion.idDeclaracion}`}>
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 2,
                          }).format(declaracion.cuotaPagar)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {declaraciones.declaraciones.length > 0 && (
                <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20" data-testid="card-total-cuota">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-card-foreground">
                      Total a pagar {selectedYear === "all" ? "(todos los años)" : `(año ${selectedYear})`}
                    </p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-total-cuota">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2,
                      }).format(declaraciones.totalCuota)}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        <NuevaPropiedadDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          clienteId={clienteId}
          clienteNombre={`${cliente.nombre} ${cliente.apellidos}`}
        />

        <NuevoClienteDialog
          open={editClienteDialogOpen}
          onOpenChange={setEditClienteDialogOpen}
          cliente={cliente}
        />
      </div>
    </div>
  );
}
