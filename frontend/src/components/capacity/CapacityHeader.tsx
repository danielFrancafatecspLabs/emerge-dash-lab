import React from "react";

export function CapacityHeader() {
  return (
    <header className="max-w-4xl mx-auto mb-6 text-center">
      <h1 className="text-3xl font-bold text-foreground mb-1">Capacity dos Desenvolvedores</h1>
      <p className="text-sm text-muted-foreground mb-2">
        Acompanhe a alocação de horas, previsão de entrega e atividades extras
        de cada desenvolvedor. Capacity é o limite de horas mensais (160h),
        sendo 70% para experimentos e 30% para atividades gerais.
      </p>
      <div className="flex flex-wrap gap-2 justify-center items-center mt-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lab-primary/10 text-lab-primary font-medium text-xs">
          Experimentos: até 112h
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lab-warning/10 text-lab-warning font-medium text-xs">
          Atividades Gerais: até 48h
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground/80 font-medium text-xs">
          Total: 160h/mês
        </span>
      </div>
    </header>
  );
}
