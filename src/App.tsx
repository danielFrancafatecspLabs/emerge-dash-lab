import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import VisaoConsolidada from "./pages/VisaoConsolidada";
import ExperimentosAndamento from "./pages/ExperimentosAndamento";
import EmConstrucao from "./pages/EmConstrucao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<VisaoConsolidada />} />
            <Route path="/experimentos-andamento" element={<ExperimentosAndamento />} />
            <Route 
              path="/relatorios" 
              element={
                <EmConstrucao 
                  titulo="Relatórios" 
                  descricao="Módulo de geração de relatórios detalhados dos experimentos" 
                />
              } 
            />
            <Route 
              path="/configuracoes" 
              element={
                <EmConstrucao 
                  titulo="Configurações" 
                  descricao="Painel de configurações do sistema de monitoramento" 
                />
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
