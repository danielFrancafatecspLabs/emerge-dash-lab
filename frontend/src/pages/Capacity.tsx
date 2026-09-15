import React, { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Métricas agregadas para KPIs e destaques
  const caps = filteredDevs.map((dev) => ({
    dev,
    cap: calculateMonthlyCapacity(dev, selectedYear, selectedMonth),
  }));
  const totalDevs = caps.length;
  const totalHorasUsadas = caps.reduce((acc, c) => acc + c.cap.totalUsed, 0);
  const capacidadeTotalMes = caps.reduce(
    (acc, c) => acc + c.cap.monthCapacity,
    0
  );
  const mediaUso = totalDevs
    ? caps.reduce((acc, c) => acc + c.cap.percentUsed, 0) / totalDevs
    : 0;
  const topMaisAlocados = [...caps]
    .sort((a, b) => b.cap.percentUsed - a.cap.percentUsed)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Coluna principal */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-foreground">Capacity dos Desenvolvedores</h2>
          <p className="text-muted-foreground">
            Acompanhe a alocação de horas, previsão de entrega e atividades extras de cada desenvolvedor.
          </p>
        </div>

        {/* Filtros */}
        <Card className="shadow-card sticky top-2 z-10">
          <CardHeader className="pb-3">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o mês, ano e um desenvolvedor para focar a visão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mês</span>
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={name} value={String(idx)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Desenvolvedores</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{totalDevs}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Uso Total</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{totalHorasUsadas.toFixed(1)}h</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cap. do Mês</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{Math.round(capacidadeTotalMes)}h</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Média de Uso</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{mediaUso.toFixed(1)}%</CardContent>
          </Card>
        </div>

        {/* Abas de visualização */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList>
            <TabsTrigger value="cards">Visão em Cartões</TabsTrigger>
            <TabsTrigger value="table">Visão em Tabela</TabsTrigger>
          </TabsList>

          {/* Visão em Cartões */}
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {caps.map(({ dev, cap }) => (
                <Card key={dev.nome} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback>{dev.nome?.[0]?.toUpperCase() || "?"}</AvatarFallback></Avatar>
                      <div>
                        <CardTitle className="text-base leading-tight">{dev.nome}</CardTitle>
                        <CardDescription>Visão de {currentMonthName}/{selectedYear}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {dev.experiments.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Sem experimentos</span>
                      ) : (
                        dev.experiments.map((exp, i) => (
                          <Badge key={i} variant="secondary">{exp.nome}</Badge>
                        ))
                      )}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Progress value={cap.percentUsed} className="h-3" />
                            <span className="text-xs font-semibold min-w-[110px]">{cap.totalUsed.toFixed(1)}h / {Math.round(cap.monthCapacity)}h</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {cap.percentUsed.toFixed(1)}% do mês utilizado
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {cap.experimentsCapacity.length > 0 && (
                      <div className="space-y-1">
                        {cap.experimentsCapacity.map((b) => (
                          <div key={b.nome} className="text-xs text-foreground/80">
                            <span className="font-semibold text-foreground">{b.nome}</span> — {b.horas.toFixed(1)}h ({b.percent.toFixed(1)}%)
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <Button size="sm" onClick={() => setModalDev(dev)}>Ver detalhes</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Visão em Tabela (original) */}
          <TabsContent value="table">
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
                        <TableRow key={dev.nome} className="odd:bg-muted/30">
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
                              <div className="flex flex-col gap-1">
                                {dev.experiments.map((exp, i) => (
                                  <Badge key={i} variant="outline" className="w-fit">
                                    {exp.tamanho}
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 w-full mb-1 cursor-help">
                                    <Progress value={cap.percentUsed} className="w-32 h-3" />
                                    <span className="ml-1 text-xs font-semibold text-foreground">
                                      {cap.totalUsed.toFixed(1)}h / {Math.round(cap.monthCapacity)}h
                                    </span>
                                    <span className="text-xs text-muted-foreground">({cap.percentUsed.toFixed(1)}%)</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Utilizado: {cap.totalUsed.toFixed(1)}h de {Math.round(cap.monthCapacity)}h ({cap.percentUsed.toFixed(1)}%)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
          </TabsContent>
        </Tabs>

        {modalDev && (
          <CapacityDevModal dev={modalDev} onClose={() => setModalDev(null)} />
        )}
      </div>

      {/* Aside */}
      <aside className="space-y-6">
        <CapacityDevHistory history={history} />
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle>Mais alocados</CardTitle>
            <CardDescription>Top 5 por uso de capacidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMaisAlocados.map(({ dev, cap }) => (
              <div key={dev.nome} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dev.nome}</span>
                  <span className="text-muted-foreground">{cap.percentUsed.toFixed(0)}%</span>
                </div>
                <Progress value={cap.percentUsed} />
              </div>
            ))}
            {topMaisAlocados.length === 0 && (
              <span className="text-sm text-muted-foreground">Sem dados para exibir</span>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
