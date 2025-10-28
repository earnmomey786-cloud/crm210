import { useState } from "react";
import { Receipt, Plus, AlertCircle, Calculator, Calendar, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Propiedad, DocumentoAdquisicion } from "@shared/schema";
import { insertDocumentoAdquisicionSchema } from "@shared/schema";

interface AdquisicionTabProps {
  propiedad: Propiedad;
  documentos: DocumentoAdquisicion[];
  onAddDocument: (data: any) => Promise<void>;
  isAddingDocument: boolean;
  onCalculateValorAmortizable: () => Promise<void>;
  isCalculatingValorAmortizable: boolean;
  onCalculateAmortizacion: (data: any) => Promise<void>;
  isCalculatingAmortization: boolean;
}

const tiposDocumentos = [
  { value: 'precio_compra', label: 'Precio de Compra', icon: '💰' },
  { value: 'gastos_notario', label: 'Gastos Notario', icon: '📝' },
  { value: 'gastos_registro', label: 'Gastos Registro', icon: '📋' },
  { value: 'itp', label: 'ITP (Impuesto Transmisiones)', icon: '🏛️' },
  { value: 'iva_compra', label: 'IVA Compra', icon: '📊' },
  { value: 'gastos_biuro_compra', label: 'Gastos Gestoría Compra', icon: '🏢' },
  { value: 'gastos_agencia', label: 'Gastos Agencia Inmobiliaria', icon: '🏠' },
  { value: 'mejoras', label: 'Mejoras (después de compra)', icon: '🔨' },
];

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const formSchema = insertDocumentoAdquisicionSchema.omit({ usuarioAlta: true, rutaArchivo: true });

export function AdquisicionTab({
  propiedad,
  documentos,
  onAddDocument,
  isAddingDocument,
  onCalculateValorAmortizable,
  isCalculatingValorAmortizable,
  onCalculateAmortizacion,
  isCalculatingAmortization,
}: AdquisicionTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amortizacionDialogOpen, setAmortizacionDialogOpen] = useState(false);
  const [anoAmortizacion, setAnoAmortizacion] = useState(new Date().getFullYear().toString());
  const [diasAmortizacion, setDiasAmortizacion] = useState("365");
  const [porcentajeAmortizacion, setPorcentajeAmortizacion] = useState("100");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: '',
      descripcion: '',
      importe: '',
      fechaDocumento: new Date().toISOString().split('T')[0],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await onAddDocument(values);
    form.reset();
    setDialogOpen(false);
  }

  const totalAdquisicion = documentos.reduce((acc, doc) => acc + parseFloat(doc.importe), 0);

  return (
    <Card className="p-6 rounded-2xl">
      <div className="space-y-6">
        {/* Advertencias Destacadas */}
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-200 font-medium">
            <strong>Importante:</strong> Los documentos de adquisición se amortizan a lo largo de 33 años (3% anual).
            No deben confundirse con gastos anuales deducibles.
          </AlertDescription>
        </Alert>

        {/* Header con Total */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Documentos de Adquisición
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Costos únicos que se amortizan durante 33 años
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Valor Total Adquisición</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalAdquisicion)}</p>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="space-y-3">
          {documentos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No hay documentos de adquisición registrados</p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-documento-adquisicion-empty">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Documento
              </Button>
            </div>
          ) : (
            <>
              {documentos.map((doc) => {
                const tipoInfo = tiposDocumentos.find(t => t.value === doc.tipo);
                return (
                  <div
                    key={doc.idDocumento}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover-elevate"
                    data-testid={`documento-adquisicion-${doc.idDocumento}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                        {tipoInfo?.icon || '📄'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-card-foreground">{tipoInfo?.label || doc.tipo}</p>
                          {doc.validado && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(doc.fechaDocumento)}
                          {doc.descripcion && ` • ${doc.descripcion}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-card-foreground">
                        {formatCurrency(doc.importe)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="w-full"
                data-testid="button-add-documento-adquisicion"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Documento
              </Button>
            </>
          )}
        </div>

        {/* Valor Amortizable */}
        {propiedad.valorAmortizable && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor Amortizable (Construcción)</p>
                <p className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(propiedad.valorAmortizable)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {propiedad.porcentajeConstruccion 
                    ? `${propiedad.porcentajeConstruccion}% construcción` 
                    : 'Usando 70% construcción por defecto'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Amortización Anual (3%)</p>
                <p className="text-2xl font-semibold text-card-foreground">
                  {propiedad.amortizacionAnual ? formatCurrency(propiedad.amortizacionAnual) : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botón Calcular Valor Amortizable */}
        <div className="pt-4 border-t border-border space-y-3">
          <Button
            onClick={onCalculateValorAmortizable}
            disabled={isCalculatingValorAmortizable || documentos.length === 0}
            className="w-full"
            size="lg"
            data-testid="button-calcular-valor-amortizable"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isCalculatingValorAmortizable ? 'Calculando...' : 'Calcular Valor Amortizable'}
          </Button>
          {documentos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Agregue al menos un documento para calcular el valor amortizable
            </p>
          )}
          
          {/* Botón Calcular Amortización Anual */}
          {propiedad.valorAmortizable && (
            <Button
              onClick={() => setAmortizacionDialogOpen(true)}
              disabled={!propiedad.valorAmortizable}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-abrir-calcular-amortizacion"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calcular Amortización Anual
            </Button>
          )}
        </div>
      </div>

      {/* Dialog Agregar Documento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Documento de Adquisición</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo-documento">
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposDocumentos.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.icon} {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="importe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importe (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        data-testid="input-importe-documento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} data-testid="input-fecha-documento" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Detalles del documento..." {...field} data-testid="input-descripcion-documento" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isAddingDocument} data-testid="button-submit-documento">
                  {isAddingDocument ? 'Guardando...' : 'Guardar Documento'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Calcular Amortización Anual */}
      <Dialog open={amortizacionDialogOpen} onOpenChange={setAmortizacionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Calcular Amortización Anual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-200 text-sm">
                Calcula la amortización prorrateada por días alquilados y porcentaje de propiedad
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="ano-amortizacion">Año</Label>
                <Input
                  id="ano-amortizacion"
                  type="number"
                  value={anoAmortizacion}
                  onChange={(e) => setAnoAmortizacion(e.target.value)}
                  min="2000"
                  max="2100"
                  data-testid="input-ano-amortizacion"
                />
              </div>
              
              <div>
                <Label htmlFor="dias-amortizacion">Días Alquilados</Label>
                <Input
                  id="dias-amortizacion"
                  type="number"
                  value={diasAmortizacion}
                  onChange={(e) => setDiasAmortizacion(e.target.value)}
                  min="1"
                  max="366"
                  data-testid="input-dias-amortizacion"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número de días que la propiedad estuvo alquilada en el año
                </p>
              </div>
              
              <div>
                <Label htmlFor="porcentaje-amortizacion">Porcentaje de Propiedad (%)</Label>
                <Input
                  id="porcentaje-amortizacion"
                  type="number"
                  value={porcentajeAmortizacion}
                  onChange={(e) => setPorcentajeAmortizacion(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  data-testid="input-porcentaje-amortizacion"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Porcentaje de propiedad del copropietario (100% si no hay copropietarios)
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmortizacionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await onCalculateAmortizacion({
                    ano: parseInt(anoAmortizacion),
                    dias: parseInt(diasAmortizacion),
                    porcentaje: parseFloat(porcentajeAmortizacion),
                  });
                  setAmortizacionDialogOpen(false);
                }}
                disabled={isCalculatingAmortization}
                data-testid="button-submit-amortizacion"
              >
                {isCalculatingAmortization ? 'Calculando...' : 'Calcular Amortización'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
