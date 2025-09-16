import React from "react";
import { Lightbulb, Star, TestTube } from "lucide-react";
import { BlinkingDot } from "./BlinkingDot";

export function renderSinalBadge(value: number | string | undefined) {
  let val = value;
  if (typeof val === "string") val = parseFloat(val);
  let color = "#bbb";
  if (val === 3) color = "#22c55e";
  else if (val === 2) color = "#eab308";
  else if (val === 1) color = "#ef4444";
  return (
    <span
      className="flex items-center"
      style={{
        minWidth: 140,
        justifyContent: "center",
        display: "inline-flex",
      }}
    >
      <BlinkingDot color={color} />
    </span>
  );
}

export function renderIniciativaBadge(value: string | undefined) {
  const badgeColor = "bg-gradient-to-r from-[#7a0019]/90 to-gray-700/90";
  const textColor = "text-white";
  let icon = <Star className="w-4 h-4 text-[#eab308] animate-spin-slow" />;
  if (
    typeof value === "string" &&
    value.toLowerCase().includes("estratégica")
  ) {
    icon = <Lightbulb className="w-4 h-4 text-[#eab308] animate-pulse" />;
  }
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow-lg border-2 border-[#7a0019]/30 font-bold text-sm ${badgeColor} ${textColor} transition-all duration-300`}
      style={{
        fontFamily: "Segoe UI, Arial, sans-serif",
        minWidth: 140,
        justifyContent: "center",
        display: "inline-flex",
      }}
    >
      {icon}
      {typeof value === "string" ? value : "Sem iniciativa"}
    </span>
  );
}

export function renderExperimentacaoBadge(value: string | undefined) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  let icon, badgeColor, textColor, displayValue;
  if (status.includes("concluido")) {
    icon = <Lightbulb className="w-4 h-4 text-green-400 animate-pulse" />;
    badgeColor =
      "bg-gradient-to-r from-green-200/80 to-green-400/80 border-green-300";
    textColor = "text-green-900";
    displayValue = "Concluído";
  } else if (status.includes("arquivado")) {
    icon = <Lightbulb className="w-4 h-4 text-gray-400" />;
    badgeColor =
      "bg-gradient-to-r from-gray-100/80 to-gray-400/80 border-gray-300";
    textColor = "text-gray-700";
    displayValue = "Arquivado";
  } else if (status.includes("andamento")) {
    icon = <TestTube className="w-4 h-4 text-yellow-400 animate-pulse" />;
    badgeColor =
      "bg-gradient-to-r from-yellow-50/80 to-yellow-200/80 border-yellow-200";
    textColor = "text-yellow-700";
    displayValue = "Em andamento";
  } else if (status === "" || status.includes("não iniciado")) {
    icon = <Lightbulb className="w-4 h-4 text-gray-400" />;
    badgeColor = "bg-gray-100/60 border-gray-300";
    textColor = "text-gray-700";
    displayValue = "Não iniciado";
  } else if (status.includes("pivot")) {
    icon = <Lightbulb className="w-4 h-4 text-purple-400 animate-pulse" />;
    badgeColor =
      "bg-gradient-to-r from-purple-200/80 to-purple-400/80 border-purple-300";
    textColor = "text-purple-900";
    displayValue = "Pivot";
  } else if (status.includes("backlog")) {
    icon = <Lightbulb className="w-4 h-4 text-orange-400 animate-pulse" />;
    badgeColor =
      "bg-gradient-to-r from-orange-200/80 to-orange-400/80 border-orange-300";
    textColor = "text-orange-900";
    displayValue = "Backlog";
  } else {
    icon = <Lightbulb className="w-4 h-4 text-gray-400" />;
    badgeColor =
      "bg-gradient-to-r from-gray-100/80 to-gray-400/80 border-gray-300";
    textColor = "text-gray-700";
    displayValue =
      typeof value === "string" && value !== "" ? value : "Não iniciado";
  }
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow border-2 font-bold text-sm ${badgeColor} ${textColor} transition-all duration-300`}
      style={{
        fontFamily: "Segoe UI, Arial, sans-serif",
        minWidth: 140,
        justifyContent: "center",
        display: "inline-flex",
      }}
    >
      {icon}
      {displayValue}
    </span>
  );
}

export function renderIdeiaProblemaBadge(value: string | undefined) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  let icon, badgeColor, textColor, displayValue;
  if (status === "concluído" || status === "concluido") {
    icon = <Lightbulb className="w-4 h-4 text-yellow-300 animate-pulse" />;
    badgeColor = "bg-yellow-100/60 border-yellow-300";
    textColor = "text-yellow-700";
    displayValue = "Concluído";
  } else if (status === "" || status === "não iniciado") {
    icon = <Lightbulb className="w-4 h-4 text-gray-400" />;
    badgeColor = "bg-gray-100/60 border-gray-300";
    textColor = "text-gray-700";
    displayValue = "Não iniciado";
  } else if (status === "em prospecção") {
    icon = <Lightbulb className="w-4 h-4 text-orange-400 animate-pulse" />;
    badgeColor = "bg-orange-100/60 border-orange-300";
    textColor = "text-orange-700";
    displayValue = "Em prospecção";
  } else if (status === "parado") {
    icon = <Lightbulb className="w-4 h-4 text-red-500" />;
    badgeColor = "bg-red-100/60 border-red-300";
    textColor = "text-red-700";
    displayValue = "Parado";
  } else {
    icon = <Lightbulb className="w-4 h-4 text-gray-400" />;
    badgeColor = "bg-gray-100/60 border-gray-300";
    textColor = "text-gray-700";
    displayValue =
      typeof value === "string" && value !== "" ? value : "Não iniciado";
  }
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow border font-bold text-sm ${badgeColor} ${textColor} transition-all duration-300`}
      style={{
        fontFamily: "Segoe UI, Arial, sans-serif",
        minWidth: 140,
        justifyContent: "center",
        display: "inline-flex",
      }}
    >
      {icon}
      {displayValue}
    </span>
  );
}
