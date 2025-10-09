import React from "react";
import { useState } from "react";
import { DEVELOPERS } from "@/components/capacity/mockCapacityData";
import { calculateMonthlyCapacity } from "@/lib/capacityUtils";
import { CapacityFilterBar } from "@/components/capacity/CapacityFilterBar";
import { CapacityDevModal } from "@/components/capacity/CapacityDevModal";
import { CapacityDevHistory } from "@/components/capacity/CapacityDevHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data for demonstration
const experiments = {
  "Daniel França": [{ nome: "Exp IA", previsaoTermino: "2025-10-10" }],
  // ...add for other devs
};
const atividadesExtras = {
  "Daniel França": ["Pesquisa de IA", "Review Experimento X"],
  // ...add for other devs
};

function calcularAlocacao(dev) {
  const totalHoras = 160;
  const maxExp = totalHoras * 0.7;
  const maxExtras = totalHoras * 0.3;
  // Simulação: 1 experimento = 40h, cada extra = 12h
  const horasExp = (experiments[dev]?.length || 0) * 40;
  const horasExtras = (atividadesExtras[dev]?.length || 0) * 12;
  const percentExp = Math.min((horasExp / maxExp) * 100, 100);
  const percentExtras = Math.min((horasExtras / maxExtras) * 100, 100);
  return { percentExp, percentExtras, horasExp, horasExtras };
}

function estimarEntrega(dev) {
  // Simulação: entrega = hoje + (horasExp / (maxExp / 5 dias))
  const { horasExp } = calcularAlocacao(dev);
  const dias = Math.ceil(horasExp / ((160 * 0.7) / 5));
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + dias);
  return hoje.toLocaleDateString();
}

export default function Capacity() {
  // Nome do mês atual
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const currentMonthName = monthNames[selectedMonth];
  // Função para verificar se experimento está no mês atual
  function isExperimentInCurrentMonth(exp) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const start = new Date(exp.dataInicio);
    const end = new Date(exp.previsaoTermino);
    // Se o experimento começa ou termina no mês atual
    return (
      (start.getMonth() === month && start.getFullYear() === year) ||
      (end.getMonth() === month && end.getFullYear() === year)
    );
  }

  const [filterDev, setFilterDev] = useState("");
  const [modalDev, setModalDev] = useState(null);
  // Exemplo de histórico fake
  const history = [
    { mes: "Jul/25", percent: 80 },
    { mes: "Ago/25", percent: 65 },
    { mes: "Set/25", percent: 72 },
  ];

  const filteredDevs = filterDev
    ? DEVELOPERS.filter((d) => d.nome === filterDev)
    : DEVELOPERS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-foreground">Capacity dos Desenvolvedores</h2>
        <p className="text-muted-foreground">
          Acompanhe a alocação de horas, previsão de entrega e atividades extras de cada desenvolvedor.
        </p>
      </div>

      {/* Filtros */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o mês, ano e um desenvolvedor para focar a visão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mês</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ano</span>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-24"
                min={2020}
                max={2100}
              />
            </div>
            <div className="ml-auto w-full sm:w-auto">
              <CapacityFilterBar onFilter={setFilterDev} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela principal */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Capacidade por Desenvolvedor</CardTitle>
          <CardDescription>
            Visão do mês de {currentMonthName}/{selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dev</TableHead>
                <TableHead>Experimentos</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Previsão</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Capacity Total</TableHead>
                <TableHead>Capacity por Experimento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevs.map((dev) => {
                const cap = calculateMonthlyCapacity(
                  dev,
                  selectedYear,
                  selectedMonth
                );
                function formatDate(dateStr) {
                  if (!dateStr) return "-";
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime())) return dateStr;
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = String(d.getFullYear()).slice(-2);
                  return `${day}/${month}/${year}`;
                }
                return (
                  <TableRow key={dev.nome}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>
                            {dev.nome?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground text-xs sm:text-sm">{dev.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dev.experiments.length === 0 ? (
                        <span className="text-muted-foreground">Nenhum</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {dev.experiments.map((exp, i) => (
                            <Badge key={i} variant="secondary" className="w-fit">
                              {exp.nome}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {dev.experiments.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <ul className="list-disc ml-4">
                          {dev.experiments.map((exp, i) => (
                            <li key={i} className="text-foreground/80">{exp.tamanho}</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell>
                      {dev.experiments.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <ul className="list-disc ml-4">
                          {dev.experiments.map((exp, i) => (
                            <li key={i} className="text-foreground/80">{formatDate(exp.dataInicio)}</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell>
                      {dev.experiments.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <ul className="list-disc ml-4">
                          {dev.experiments.map((exp, i) => (
                            <li key={i} className="text-foreground/80">{formatDate(exp.previsaoTermino)}</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell>
                      {dev.experiments.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <ul className="list-disc ml-4">
                          {dev.experiments.map((exp, i) => (
                            <li key={i} className="text-foreground/80">{exp.horas}h</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-2 w-full mb-1">
                        <Progress value={cap.percentUsed} className="w-32 h-3" />
                        <span className="ml-1 text-xs font-semibold text-foreground">
                          {cap.totalUsed.toFixed(1)}h / {Math.round(cap.monthCapacity)}h
                        </span>
                        <span className="text-xs text-muted-foreground">({cap.percentUsed.toFixed(1)}%)</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {cap.experimentsCapacity.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {cap.experimentsCapacity.map((b) => (
                            <span key={b.nome} className="text-xs text-foreground/80">
                              <span className="font-semibold text-foreground">{b.nome}</span> — {b.horas.toFixed(1)}h ({b.percent.toFixed(1)}%)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setModalDev(dev)}>
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {modalDev && (
        <CapacityDevModal dev={modalDev} onClose={() => setModalDev(null)} />
      )}

      <CapacityDevHistory history={history} />
    </div>
  );
}
