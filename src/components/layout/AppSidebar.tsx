import { useState } from "react"
import { BarChart3, Activity, FileText, Settings } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { 
    title: "Visão Consolidada", 
    url: "/", 
    icon: BarChart3,
    description: "Dashboard geral dos experimentos"
  },
  { 
    title: "Experimentos em Andamento", 
    url: "/experimentos-andamento", 
    icon: Activity,
    description: "Acompanhamento de processos ativos"
  },
  { 
    title: "Relatórios", 
    url: "/relatorios", 
    icon: FileText,
    description: "Relatórios detalhados"
  },
  { 
    title: "Configurações", 
    url: "/configuracoes", 
    icon: Settings,
    description: "Ajustes do sistema"
  },
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-primary text-primary-foreground font-medium shadow-card" 
      : "hover:bg-lab-secondary/10 text-foreground"

  return (
    <Sidebar
      className="w-72 bg-gradient-primary border-r-0 transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="bg-transparent">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
              <div>
                <h2 className="text-lg font-bold text-white">Claro Brasil</h2>
                <p className="text-sm text-white/80">P&D LAB</p>
              </div>
          </div>
        </div>

        {/* Period Selection */}
        <div className="p-6 border-b border-white/10">
          <div className="text-center">
            <p className="text-sm text-white/80 mb-1">Período de aferição</p>
            <div className="text-white font-medium">Jan/25 a Jun/25</div>
          </div>
        </div>

        <SidebarGroup className="px-4 py-6">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 rounded-lg">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="w-5 h-5 mr-3 text-white/80" />
                      <div className="flex-1">
                        <div className={`font-medium ${isActive(item.url) ? "text-white" : "text-white"}`}>
                          {item.title}
                        </div>
                        <div className={`text-xs ${isActive(item.url) ? "text-white/90" : "text-white/60"}`}>
                          {item.description}
                        </div>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}