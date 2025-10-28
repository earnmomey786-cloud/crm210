import { FileText, DollarSign, Calendar, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Propiedad, Cliente } from "@shared/schema";

interface DatosGeneralesTabProps {
  propiedad: Propiedad;
  cliente: Cliente;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCurrency(value: string | null | undefined): string {
  if (!value) return '0,00 €';
  const num = parseFloat(value);
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

export function DatosGeneralesTab({ propiedad, cliente }: DatosGeneralesTabProps) {
  return (
    <Card className="p-6 rounded-2xl">
      <div className="space-y-8">
        {/* Información General */}
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

        {/* Datos de Compra */}
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

        {/* Valores Catastrales */}
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
                  <span className="text-sm text-muted-foreground">Valor Suelo</span>
                  <span className="font-medium text-card-foreground">
                    {formatCurrency(propiedad.valorCatastralSuelo)}
                  </span>
                </div>
              )}
              {propiedad.valorCatastralConstruccion && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Valor Construcción</span>
                  <span className="font-medium text-card-foreground">
                    {formatCurrency(propiedad.valorCatastralConstruccion)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        {propiedad.notas && (
          <div className="pt-6 border-t border-border">
            <h3 className="font-medium text-card-foreground mb-2">Notas</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {propiedad.notas}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
