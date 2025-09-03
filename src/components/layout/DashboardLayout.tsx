import { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Menu } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card flex items-center px-6 shadow-card">
            <SidebarTrigger className="mr-4 p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                Laboratório de Tecnologias Emergentes
              </h1>
              <p className="text-sm text-muted-foreground">
                Dashboard de monitoramento e análise
              </p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}