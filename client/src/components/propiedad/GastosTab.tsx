import { useState } from "react";
import { Wallet, Plus, Calendar, AlertTriangle, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GastosTabProps {
  propiedadId: number;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const gastosProportionales = [
  { value: 'ibi', label: 'IBI (Impuesto Inmobiliario)', icon: '🏛️', description: 'Prorrateado por días alquilados' },
  { value: 'comunidad', label: 'Gastos Comunidad', icon: '🏢', description: 'Prorrateado por días alquilados' },
  { value: 'seguro', label: 'Seguro Hogar', icon: '🛡️', description: 'Prorrateado por días alquilados' },
  { value: 'intereses', label: 'Intereses Hipoteca', icon: '🏦', description: 'Prorrateado por días alquilados' },
  { value: 'suministros', label: 'Suministros (luz, agua, gas)', icon: '💡', description: 'Prorrateado por días alquilados' },
  { value: 'conservacion', label: 'Conservación/Mantenimiento', icon: '🔧', description: 'Prorrateado por días alquilados' },
];

const gastos100Deducibles = [
  { value: 'reparacion', label: 'Reparaciones', icon: '🔨', description: '100% deducible (puede generar renta negativa)' },
  { value: 'biuro', label: 'Gastos Gestoría', icon: '📋', description: '100% deducible' },
  { value: 'agencia', label: 'Gastos Agencia', icon: '🏠', description: '100% deducible' },
  { value: 'abogado', label: 'Gastos Abogado', icon: '⚖️', description: '100% deducible' },
  { value: 'publicidad', label: 'Publicidad', icon: '📣', description: '100% deducible' },
];

export function GastosTab({ propiedadId }: GastosTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  return (
    <Card className="p-6 rounded-2xl">
      <div className="space-y-6">
        {/* Header con Selector de Año */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Gastos Anuales Deducibles
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gastos que se deducen en el año en que se generan
            </p>
          </div>
          <div className="w-32">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger data-testid="select-year-gastos">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advertencia */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-200 font-medium">
            <strong>Importante:</strong> Los gastos se deducen en el año en que se pagan. Los gastos proporcionales se prorratean según días alquilados.
          </AlertDescription>
        </Alert>

        {/* Gastos Proporcionales */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Gastos Proporcionales</h3>
              <p className="text-xs text-muted-foreground">Se prorratean según días alquilados / 365</p>
            </div>
          </div>
          <div className="space-y-2 pl-12">
            {gastosProportionales.map((gasto) => (
              <div
                key={gasto.value}
                className="flex items-center gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg"
              >
                <span className="text-xl">{gasto.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-card-foreground">{gasto.label}</p>
                  <p className="text-xs text-muted-foreground">{gasto.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gastos 100% Deducibles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Gastos 100% Deducibles</h3>
              <p className="text-xs text-muted-foreground">Se deducen completamente sin prorrateo</p>
            </div>
          </div>
          <div className="space-y-2 pl-12">
            {gastos100Deducibles.map((gasto) => (
              <div
                key={gasto.value}
                className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-950/10 border border-green-200/50 dark:border-green-800/30 rounded-lg"
              >
                <span className="text-xl">{gasto.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-card-foreground">{gasto.label}</p>
                  <p className="text-xs text-muted-foreground">{gasto.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder para lista de gastos (se implementará después) */}
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">
            No hay gastos registrados para {selectedYear}
          </p>
          <Button data-testid="button-add-gasto">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Gasto
          </Button>
        </div>
      </div>
    </Card>
  );
}
