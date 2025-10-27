import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ClientesList from "@/pages/clientes-list";
import ClientePropiedades from "@/pages/cliente-propiedades";
import PropiedadDetalle from "@/pages/propiedad-detalle";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ClientesList} />
      <Route path="/clientes/:id" component={ClientePropiedades} />
      <Route path="/propiedades/:id" component={PropiedadDetalle} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
