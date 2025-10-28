import { Calculator, Users, Receipt, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Propiedad, Cliente } from "@shared/schema";

interface CalculosTabProps {
  propiedad: Propiedad;
  cliente: Cliente;
  copropietarios: any[];
  propietarioName: string;
}

function getBadgeVariant(tipo: string) {
  switch (tipo) {
    case 'imputacion':
      return 'default';
    case 'alquiler':
      return 'default';
    case 'mixta':
      return 'default';
    default:
      return 'secondary';
  }
}

function getBadgeColor(tipo: string) {
  switch (tipo) {
    case 'imputacion':
      return 'bg-[hsl(350,30%,85%)] text-[hsl(350,40%,40%)] hover:bg-[hsl(350,30%,80%)] dark:bg-[hsl(350,30%,25%)] dark:text-[hsl(350,30%,85%)]';
    case 'alquiler':
      return 'bg-[hsl(140,30%,80%)] text-[hsl(140,40%,30%)] hover:bg-[hsl(140,30%,75%)] dark:bg-[hsl(140,30%,20%)] dark:text-[hsl(140,30%,85%)]';
    case 'mixta':
      return 'bg-[hsl(45,40%,85%)] text-[hsl(45,50%,35%)] hover:bg-[hsl(45,40%,80%)] dark:bg-[hsl(45,40%,25%)] dark:text-[hsl(45,40%,85%)]';
    default:
      return '';
  }
}

export function CalculosTab({ propiedad, cliente, copropietarios, propietarioName }: CalculosTabProps) {
  const totalPorcentaje = copropietarios.reduce((acc, cp) => acc + parseFloat(cp.porcentaje), 100);
  const esCopropiedad = copropietarios.length > 0;

  return (
    <div className="space-y-6">
      {/* Bloque 1: Tipo de Declaración */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <div className="text-2xl font-bold text-primary">1</div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Tipo de Declaración
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Define cómo se calculará el Modelo 210 para esta propiedad
            </p>
            <div className="flex items-center gap-3">
              <Badge className={getBadgeColor(propiedad.tipoDeclaracion)}>
                {propiedad.tipoDeclaracion === 'imputacion' && 'Imputación de Renta'}
                {propiedad.tipoDeclaracion === 'alquiler' && 'Alquiler Real'}
                {propiedad.tipoDeclaracion === 'mixta' && 'Mixta (Alquiler + Imputación)'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Bloque 2: Copropietarios */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <div className="text-2xl font-bold text-primary">2</div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Copropietarios
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {esCopropiedad 
                ? 'La propiedad está compartida. Cada copropietario debe presentar su propia declaración.' 
                : 'Propiedad de un solo titular. No hay copropietarios registrados.'}
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                <span className="font-medium text-card-foreground">{propietarioName}</span>
                <span className="text-sm font-semibold text-primary">100%</span>
              </div>
              {copropietarios.map((cp: any) => (
                <div 
                  key={cp.idCopropietario}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                  data-testid={`copropietario-${cp.idCopropietario}`}
                >
                  <div>
                    <p className="font-medium text-card-foreground">{cp.nombreCompleto}</p>
                    <p className="text-xs text-muted-foreground">{cp.nie}</p>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">{cp.porcentaje}%</span>
                </div>
              ))}
            </div>
            {esCopropiedad && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Total reparto:</strong> {totalPorcentaje}%
                  {totalPorcentaje !== 100 && (
                    <span className="text-destructive ml-2">⚠️ La suma debe ser 100%</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Bloque 3: Calcular Modelo 210 */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <div className="text-2xl font-bold text-primary">3</div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground mb-2 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Calcular Modelo 210
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Genera la declaración de impuestos para esta propiedad y todos sus copropietarios
            </p>
            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
              <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                Formulario de cálculo disponible próximamente
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
