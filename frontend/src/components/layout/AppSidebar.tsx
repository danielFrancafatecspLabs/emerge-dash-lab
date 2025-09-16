import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Activity, FileText, Settings, Menu } from "lucide-react";
import claroLogo from "@/assets/logo_claro.png";

const navigationItems = [
  { title: "Visão Consolidada", url: "/", icon: BarChart3 },
  {
    title: "Eficiência Operacional",
    url: "/eficiencia-operacional",
    icon: BarChart3,
  },
  {
    title: "Experimentos em Andamento",
    url: "/experimentos-andamento",
    icon: Activity,
  },
  {
    title: "Pilotos em Andamento",
    url: "/pilotos-em-andamento",
    icon: Activity,
  },
  {
    title: "Lista de Experimentos",
    url: "/lista-experimentos",
    icon: FileText,
  },
  { title: "Esteira de Demandas", url: "/esteira-demandas", icon: Menu },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Repositório", url: "/repositorio", icon: FileText },
  { title: "Sobre Nós", url: "/sobre-nos", icon: FileText },
];

export function AppSidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col fixed top-0 left-0 z-40">
      <div className="flex flex-col items-center justify-center py-6 border-b border-gray-800">
        <span
          className="text-3xl font-semibold tracking-tight text-white mb-1"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          Claro
        </span>
        <span className="text-sm font-medium text-white opacity-80 tracking-wide">
          Portfólio beOn Labs
        </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded hover:bg-gray-800 transition ${
                isActive ? "bg-gray-800 font-bold" : ""
              }`
            }
            end
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.title}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-6 mt-auto">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition shadow"
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
            window.location.reload();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
