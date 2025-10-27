import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Plus, Users, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NuevoClienteDialog } from "@/components/nuevo-cliente-dialog";
import type { Cliente } from "@shared/schema";

export default function ClientesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes', searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/clientes?q=${encodeURIComponent(searchTerm)}`
        : '/api/clientes';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
  });

  const filteredClientes = clientes || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Mis Clientes
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus clientes polacos y sus propiedades en España
            </p>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="rounded-lg shadow-md"
            data-testid="button-nuevo-cliente"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre, NIE o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 text-base"
              data-testid="input-search-clientes"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-6 rounded-2xl">
                <Skeleton className="h-8 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm ? "No se encontraron clientes" : "No hay clientes aún"}
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {searchTerm 
                ? "Intenta con otros términos de búsqueda" 
                : "Comienza agregando tu primer cliente polaco para gestionar sus propiedades"}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setDialogOpen(true)}
                variant="default"
                className="rounded-lg"
                data-testid="button-nuevo-cliente-empty"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primer Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClientes.map(cliente => (
              <ClienteCard key={cliente.idCliente} cliente={cliente} />
            ))}
          </div>
        )}

        <NuevoClienteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </div>
  );
}

function ClienteCard({ cliente }: { cliente: Cliente }) {
  const { data: propiedades } = useQuery<any[]>({
    queryKey: ['/api/clientes', cliente.idCliente, 'propiedades'],
  });

  const propiedadesActivas = propiedades?.filter(p => p.activa) || [];
  const cantidadPropiedades = propiedadesActivas.length;

  return (
    <Link href={`/clientes/${cliente.idCliente}`} data-testid={`link-cliente-${cliente.idCliente}`}>
      <Card 
        className="p-6 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer hover-elevate active-elevate-2 group"
        data-testid={`card-cliente-${cliente.idCliente}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground mb-1" data-testid={`text-nombre-${cliente.idCliente}`}>
              {cliente.nombre} {cliente.apellidos}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-mono font-medium" data-testid={`text-nie-${cliente.idCliente}`}>{cliente.nie}</span>
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-medium">Email:</span>
            <span className="truncate" data-testid={`text-email-${cliente.idCliente}`}>{cliente.email}</span>
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-medium">Teléfono:</span>
            <span data-testid={`text-telefono-${cliente.idCliente}`}>{cliente.telefono}</span>
          </p>
          {cliente.ciudadPolonia && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-medium">Ciudad:</span>
              <span data-testid={`text-ciudad-${cliente.idCliente}`}>{cliente.ciudadPolonia}</span>
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground" data-testid={`text-count-propiedades-${cliente.idCliente}`}>
              {cantidadPropiedades} {cantidadPropiedades === 1 ? 'propiedad' : 'propiedades'}
            </span>
          </div>
          <Badge 
            variant="secondary" 
            className="rounded-full"
            data-testid={`badge-propiedades-${cliente.idCliente}`}
          >
            {cantidadPropiedades}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
