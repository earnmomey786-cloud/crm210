import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertClienteSchema, type InsertCliente, clientes } from "@shared/schema";
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
import { Loader2 } from "lucide-react";

interface NuevoClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
}

type Cliente = typeof clientes.$inferSelect;

export function NuevoClienteDialog({ open, onOpenChange, cliente }: NuevoClienteDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!cliente;

  const form = useForm<InsertCliente>({
    resolver: zodResolver(insertClienteSchema),
    defaultValues: {
      nie: cliente?.nie || "",
      nombre: cliente?.nombre || "",
      apellidos: cliente?.apellidos || "",
      email: cliente?.email || "",
      telefono: cliente?.telefono || "",
      ciudadPolonia: cliente?.ciudadPolonia || "",
      direccionPolonia: cliente?.direccionPolonia || "",
      notas: cliente?.notas || "",
    },
  });

  useEffect(() => {
    form.reset({
      nie: cliente?.nie || "",
      nombre: cliente?.nombre || "",
      apellidos: cliente?.apellidos || "",
      email: cliente?.email || "",
      telefono: cliente?.telefono || "",
      ciudadPolonia: cliente?.ciudadPolonia || "",
      direccionPolonia: cliente?.direccionPolonia || "",
      notas: cliente?.notas || "",
    });
  }, [cliente, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCliente) => {
      if (isEditMode) {
        return await apiRequest("PUT", `/api/clientes/${cliente.idCliente}`, data);
      }
      return await apiRequest("POST", "/api/clientes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/clientes', cliente.idCliente] });
      }
      toast({
        title: isEditMode ? "Cliente actualizado" : "Cliente creado",
        description: isEditMode 
          ? "El cliente ha sido actualizado exitosamente."
          : "El cliente ha sido creado exitosamente.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el cliente. Verifica que el NIE y email sean únicos.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCliente) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Actualiza la información del cliente" 
              : "Agrega un nuevo cliente polaco para gestionar sus propiedades en España"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Datos Básicos</h3>
              
              <FormField
                control={form.control}
                name="nie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      NIE <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="X1234567L" 
                        {...field} 
                        className="rounded-lg h-11"
                        data-testid="input-nie"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Nombre <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Piotr" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-nombre"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Apellidos <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Kowalski" 
                          {...field} 
                          className="rounded-lg h-11"
                          data-testid="input-apellidos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="piotr@ejemplo.com" 
                        {...field} 
                        className="rounded-lg h-11"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Teléfono <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+48123456789" 
                        {...field} 
                        className="rounded-lg h-11"
                        data-testid="input-telefono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-lg text-foreground">Dirección en Polonia</h3>
              
              <FormField
                control={form.control}
                name="ciudadPolonia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Ciudad</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Varsovia" 
                        {...field} 
                        className="rounded-lg h-11"
                        data-testid="input-ciudad-polonia"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccionPolonia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Dirección Completa</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ul. Ejemplo 123, 00-001 Varsovia" 
                        {...field} 
                        className="rounded-lg min-h-[80px] resize-none"
                        data-testid="input-direccion-polonia"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        placeholder="Notas adicionales sobre el cliente..." 
                        {...field} 
                        className="rounded-lg min-h-[100px] resize-none"
                        data-testid="input-notas"
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
                disabled={saveMutation.isPending}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-lg h-11"
                disabled={saveMutation.isPending}
                data-testid="button-guardar-cliente"
              >
                {saveMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditMode ? "Actualizar Cliente" : "Guardar Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
