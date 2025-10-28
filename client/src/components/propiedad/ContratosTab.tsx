import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ContratosTabProps {
  propiedadTipo: string;
}

export function ContratosTab({ propiedadTipo }: ContratosTabProps) {
  return (
    <Card className="p-6 rounded-2xl">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Contratos de Alquiler
        </h2>
        
        {propiedadTipo !== 'alquiler' && propiedadTipo !== 'mixta' ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Esta sección solo está disponible para propiedades de tipo "alquiler" o "mixta"
            </p>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Funcionalidad de contratos disponible próximamente
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
