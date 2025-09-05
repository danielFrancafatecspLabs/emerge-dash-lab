import { useEffect, useState } from 'react';
import Papa from 'papaparse';

export type Experimento = { [key: string]: string };

export function useExperimentos() {
  const [data, setData] = useState<Experimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/planilha1.csv')
      .then((res) => res.text())
      .then((csv) => {
        const result = Papa.parse(csv, { header: true });
        setData(result.data as Experimento[]);
        setLoading(false);
      });
  }, []);

  // Contadores por status
  const getCount = (col: string, value: string) =>
    data.filter((item) => (item[col] || '').trim().toLowerCase() === value.trim().toLowerCase()).length;

  // Exemplos de contadores
  const total = data.length;
  const totalProspeccao = getCount('Ideia / Problema / Oportunidade', 'em prospecção');
  const totalAndamento = getCount('Experimentação', 'em andamento');
  const totalConcluido = getCount('Experimentação', 'concluido');
  const totalConcluidoGoNoGo = data.filter((item) => (item['Experimentação'] || '').toLowerCase().includes('concluido - aguardando go/no')).length;
  const pilotosAndamento = getCount('Piloto', 'em andamento');
  const pilotosConcluidos = data.filter((item) => (item['Piloto'] || '').toLowerCase().includes('concluido')).length;

  // Gráfico: Experimentos por Etapa (usando Experimentação, Piloto, Escala, Ideia)
  const etapas = [
    'Ideia / Problema / Oportunidade',
    'Experimentação',
    'Piloto',
    'Escala',
  ];
  const experimentosPorEtapa = etapas.map((etapa) => ({
    name: etapa,
    value: data.filter((item) => item[etapa] && item[etapa].trim() !== '').length,
    percentage: 0,
  }));

  // Gráfico: Experimentos por Tipo (Tecnologia)
  const tipos = Array.from(new Set(data.map(item => item['Tecnologia']).filter(Boolean)));
  const experimentosPorTipo = tipos.map((tipo) => ({
    name: tipo,
    value: data.filter((item) => (item['Tecnologia'] || '').trim() === tipo.trim()).length,
    color: 'hsl(var(--lab-primary))',
  }));

  // Gráfico: Experimentos por Mês/Ano (usando 'Mês Conclusão' e 'Ano Conclusão')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mesesAnos: { [key: string]: { [key: string]: number } } = {};
  data.forEach(item => {
    let mesConclusao = item['Mês Conclusão']?.trim();
    let anoConclusao = item['Ano Conclusão']?.trim();
    // Se vier como float, converte para inteiro string
    if (anoConclusao && !isNaN(Number(anoConclusao))) {
      anoConclusao = String(parseInt(anoConclusao));
    }
    // Se vier como número, converte para nome do mês
    if (mesConclusao && !isNaN(Number(mesConclusao))) {
      const idx = Number(mesConclusao) - 1;
      if (idx >= 0 && idx < meses.length) {
        mesConclusao = meses[idx];
      }
    }
    if (mesConclusao && anoConclusao && meses.includes(mesConclusao)) {
      if (!mesesAnos[anoConclusao]) mesesAnos[anoConclusao] = {};
      mesesAnos[anoConclusao][mesConclusao] = (mesesAnos[anoConclusao][mesConclusao] || 0) + 1;
    }
  });
  const anos = Object.keys(mesesAnos).sort();
  const experimentosPorMes = meses.map(mes => {
    const obj: any = { month: mes };
    anos.forEach(ano => {
      obj[ano] = mesesAnos[ano][mes] || 0;
      // Adiciona lista de iniciativas para cada ano/mês
      obj[`${ano}_iniciativas`] = data
        .filter(item => {
          let mesConclusao = item['Mês Conclusão']?.trim();
          let anoConclusao = item['Ano Conclusão']?.trim();
          if (mesConclusao && !isNaN(Number(mesConclusao))) {
            const idx = Number(mesConclusao) - 1;
            if (idx >= 0 && idx < meses.length) mesConclusao = meses[idx];
          }
          if (anoConclusao && !isNaN(Number(anoConclusao))) {
            anoConclusao = String(parseInt(anoConclusao));
          }
          return mesConclusao === mes && anoConclusao === ano;
        })
        .map(item => item['Iniciativa'])
        .filter(Boolean);
    });
    return obj;
  });
  const anoColors: { [key: string]: string } = {
    '2023': '#e11d48', // vermelho
    '2024': '#2563eb', // azul
    '2025': '#22c55e', // verde
  };

  // Gráfico: Ideias que não evoluíram (Situação Atual e Próximos passos)
  const ideiasData = [
    {
      name: 'Ideias Reprovadas no critério de seleção',
      value: data.filter((item) => (item['Situação Atual e Próximos passos'] || '').toLowerCase().includes('reprovada')).length,
      color: 'hsl(var(--lab-primary))',
    },
    {
      name: 'Ideias Despriorizadas (em backlog)',
      value: data.filter((item) => (item['Situação Atual e Próximos passos'] || '').toLowerCase().includes('backlog')).length,
      color: 'hsl(var(--lab-primary-dark))',
    },
    {
      name: 'Experimentos que não atingiram o critério para piloto',
      value: data.filter((item) => (item['Situação Atual e Próximos passos'] || '').toLowerCase().includes('não atingiu critério')).length,
      color: 'hsl(var(--lab-secondary))',
    },
    {
      name: 'Experimentos sem engajamento do BU/Sponsor',
      value: data.filter((item) => (item['Situação Atual e Próximos passos'] || '').toLowerCase().includes('sem engajamento')).length,
      color: 'hsl(var(--lab-accent))',
    },
  ];

  return {
    data,
    loading,
    total,
    totalProspeccao,
    totalAndamento,
    totalConcluido,
    totalConcluidoGoNoGo,
    pilotosAndamento,
    pilotosConcluidos,
    experimentosPorEtapa,
    experimentosPorTipo,
    experimentosPorMes,
    anoColors,
    ideiasData,
  };
}
