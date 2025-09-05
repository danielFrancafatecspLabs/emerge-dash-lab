

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Activity, FileText, Settings, Menu } from "lucide-react";
import claroLogo from "@/assets/logo_claro.png";

const navigationItems = [
  { title: "Visão Consolidada", url: "/", icon: BarChart3 },
  { title: "Experimentos em Andamento", url: "/experimentos-andamento", icon: Activity },
  { title: "Lista de Experimentos", url: "/lista-experimentos", icon: FileText },
  { title: "Board Operacional", url: "/board-operacional", icon: Menu },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];



export function AppSidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col fixed top-0 left-0 z-40">
      <div className="flex items-center px-6 py-4 border-b border-gray-800 gap-3">
  <img src={claroLogo} alt="Logo Claro" className="w-10 h-10 object-contain" />
        <div>
          <span className="text-xl font-bold block">Claro Brasil</span>
          <span className="text-sm text-muted-foreground block">Laboratório de Tecnologias Emergentes</span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded hover:bg-gray-800 transition ${isActive ? "bg-gray-800 font-bold" : ""}`
            }
            end
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}