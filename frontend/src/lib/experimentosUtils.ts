// Utils para cálculos e filtros de experimentos

export type ExperimentoPorMes = {
  month: string;
  ano: number;
  [key: string]: string | number | string[];
};

export function filtrarPorAno(
  experimentosPorMes: ExperimentoPorMes[],
  anoSelecionado: string | number
): ExperimentoPorMes[] {
  if (anoSelecionado === "Todos") return experimentosPorMes;
  return experimentosPorMes.map((item) => {
    const obj: ExperimentoPorMes = { month: item.month, ano: item.ano };
    Object.keys(item).forEach((key) => {
      if (
        key === "month" ||
        key === "ano" ||
        key === `${anoSelecionado}` ||
        key === `${anoSelecionado}_iniciativas`
      ) {
        obj[key] = item[key];
      }
    });
    return obj;
  });
}

export interface ExperimentoData {
  [key: string]: string | number | undefined;
  "Início "?: string;
}

export function calcularPercentil85Dias(data: ExperimentoData[]): number {
  const today = new Date();
  const validExperimentos = data.filter(
    (row) =>
      typeof row["Início "] === "string" &&
      row["Início "] &&
      !isNaN(new Date(row["Início "]).getTime())
  );
  const diasArray = validExperimentos.map((row) => {
    const startDate =
      typeof row["Início "] === "string" ? new Date(row["Início "]) : today;
    return Math.max(
      0,
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  });
  const diasOrdenados = diasArray.sort((a, b) => a - b);
  const percentil = 0.85;
  const n = Math.floor(diasOrdenados.length * percentil);
  const diasParaMedia = diasOrdenados.slice(0, n > 0 ? n : 1);
  return diasParaMedia.length > 0
    ? Math.round(
        diasParaMedia.reduce((acc, val) => acc + val, 0) / diasParaMedia.length
      )
    : 0;
}

export function contarBacklog(
  data: ExperimentoPorMes[],
  backlogColunas: string[],
  backlogClassificacoes: string[],
  getCount: (col: string, classificacao: string) => number
): number {
  if (!data || data.length === 0) return 0;
  return backlogColunas.reduce((acc, col) => {
    return (
      acc +
      backlogClassificacoes.reduce((sum, classificacao) => {
        return sum + getCount(col, classificacao);
      }, 0)
    );
  }, 0);
}
