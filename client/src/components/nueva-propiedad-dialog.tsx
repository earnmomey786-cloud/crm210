import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertPropiedadSchema, type InsertPropiedad } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface NuevaPropiedadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: number;
  clienteNombre: string;
}

const TIPOS_INMUEBLE = [
  { value: "vivienda", label: "Vivienda" },
  { value: "garaje", label: "Garaje" },
  { value: "local", label: "Local" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
  { value: "otro", label: "Otro" },
];

export function NuevaPropiedadDialog({ open, onOpenChange, clienteId, clienteNombre }: NuevaPropiedadDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertPropiedad>({
    resolver: zodResolver(insertPropiedadSchema),
    defaultValues: {
      idCliente: clienteId,
      referenciaCatastral: "",
      direccion: "",
      provincia: "",
      municipio: "",
      tipo: "vivienda",
      tipoDeclaracion: "imputacion",
      fechaCompra: "",
      precioCompra: "",
      valorCatastralTotal: "",
      valorCatastralSuelo: "",
      valorCatastralConstruccion: "",
      notas: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPropiedad) => {
      return await apiRequest("POST", `/api/clientes/${clienteId}/propiedades`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes', clienteId, 'propiedades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      toast({
        title: "Propiedad creada",
        description: "La propiedad ha sido añadida exitosamente.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la propiedad. Verifica que la referencia catastral sea única.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPropiedad) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nueva Propiedad</DialogTitle>
          <DialogDescription>
            Agregar propiedad en España para <span className="font-semibold">{clienteNombre}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Identificación</h3>
              
              <FormField
                control={form.control}
                name="referenciaCatastral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Referencia Catastral <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1234567890123456ABCD" 
                        {...field} 
                        className="rounded-lg h-11 font-mono"
                        data-testid="input-ref-catastral"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Dirección Completa <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Calle Madrid 123, 2º izq, 28001 Madrid" 
                        {...field} 
                        className="rounded-lg h-11"
                        data-testid="input-direccion"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="provincia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Provincia</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Madrid" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-provincia"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Municipio</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Madrid" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-municipio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Tipo de Inmueble <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-lg h-11" data-testid="select-tipo-inmueble">
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_INMUEBLE.map((tipo) => (
                          <SelectItem 
                            key={tipo.value} 
                            value={tipo.value}
                            data-testid={`select-item-${tipo.value}`}
                          >
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-lg text-foreground">Tipo de Declaración</h3>
              
              <FormField
                control={form.control}
                name="tipoDeclaracion"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover-elevate cursor-pointer">
                          <RadioGroupItem value="imputacion" id="imputacion-new" data-testid="radio-imputacion-new" />
                          <Label htmlFor="imputacion-new" className="flex-1 cursor-pointer">
                            <p className="font-semibold text-foreground">Imputación</p>
                            <p className="text-sm text-muted-foreground">Propiedad vacía o de uso propio</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover-elevate cursor-pointer">
                          <RadioGroupItem value="alquiler" id="alquiler-new" data-testid="radio-alquiler-new" />
                          <Label htmlFor="alquiler-new" className="flex-1 cursor-pointer">
                            <p className="font-semibold text-foreground">Alquiler</p>
                            <p className="text-sm text-muted-foreground">Propiedad alquilada</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover-elevate cursor-pointer">
                          <RadioGroupItem value="mixta" id="mixta-new" data-testid="radio-mixta-new" />
                          <Label htmlFor="mixta-new" className="flex-1 cursor-pointer">
                            <p className="font-semibold text-foreground">Mixta</p>
                            <p className="text-sm text-muted-foreground">Parte del año alquilada, parte vacía</p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-lg text-foreground">Datos de Compra</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaCompra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Fecha de Compra <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-fecha-compra"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="precioCompra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Precio de Compra (€) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="250000.00" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-precio-compra"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-lg text-foreground">Valores Catastrales (IBI)</h3>
              <p className="text-sm text-muted-foreground">Estos valores aparecen en el recibo del IBI</p>
              
              <FormField
                control={form.control}
                name="valorCatastralTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Valor Catastral Total (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="180000.00" 
                        {...field} 
                        className="rounded-lg h-11"
                        data-testid="input-valor-total"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorCatastralSuelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Valor del Suelo (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="36000.00" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-valor-suelo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorCatastralConstruccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Valor de la Construcción (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="144000.00" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-valor-construccion"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales sobre la propiedad..." 
                        {...field} 
                        className="rounded-lg min-h-[100px] resize-none"
                        data-testid="input-notas-propiedad"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                className="flex-1 rounded-lg h-11"
                disabled={createMutation.isPending}
                data-testid="button-cancelar-propiedad"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-lg h-11"
                disabled={createMutation.isPending}
                data-testid="button-guardar-propiedad"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Guardar Propiedad
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
