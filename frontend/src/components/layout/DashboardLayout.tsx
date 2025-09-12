import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const hideHeader = location.pathname === "/lista-experimentos";
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col ml-64">
          {/* Header */}
          {!hideHeader && (
            <header className="h-16 border-b bg-card flex items-center px-6 shadow-card">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">
                  Claro Brasil - Laboratório de Tecnologias Emergentes
                </h1>
                <p className="text-sm text-muted-foreground">
                  Dashboard de monitoramento e análise de inovação
                </p>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
