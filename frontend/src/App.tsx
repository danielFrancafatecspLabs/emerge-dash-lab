import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import VisaoConsolidada from "./pages/VisaoConsolidada";
import Repositorio from "./pages/Repositorio";
import ExperimentosAndamento from "./pages/ExperimentosAndamento";
import PilotosEmAndamento from "./pages/PilotosEmAndamento";
import EmConstrucao from "./pages/EmConstrucao";
import Config from "./pages/Config";
import NotFound from "./pages/NotFound";
import ListaDeExperimentos from "./pages/ListaDeExperimentos";
import BoardView from "./pages/BoardView";
import EsteiraDeDemandas from "./pages/EsteiraDeDemandas";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/*"
            element={
              localStorage.getItem("user") ? (
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<VisaoConsolidada />} />
                    <Route
                      path="/experimentos-andamento"
                      element={<ExperimentosAndamento />}
                    />
                    <Route
                      path="/pilotos-em-andamento"
                      element={<PilotosEmAndamento />}
                    />
                    <Route
                      path="/relatorios"
                      element={
                        <EmConstrucao
                          titulo="Relatórios"
                          descricao="Módulo de geração de relatórios detalhados dos experimentos"
                        />
                      }
                    />
                    <Route path="/configuracoes" element={<Config />} />
                    <Route
                      path="/lista-experimentos"
                      element={<ListaDeExperimentos />}
                    />
                    <Route path="/board-operacional" element={<BoardView />} />
                    <Route
                      path="/esteira-demandas"
                      element={<EsteiraDeDemandas />}
                    />
                    <Route path="/repositorio" element={<Repositorio />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DashboardLayout>
              ) : (
                <Login />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
