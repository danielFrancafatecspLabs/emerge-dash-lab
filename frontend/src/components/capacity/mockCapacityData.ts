// Tabela de referência de horas por complexidade
export const EXPERIMENT_HOURS = {
  P: { complexidade: "Baixo", sprints: 2, horas: 160, semanas: 4 },
  M: { complexidade: "Médio", sprints: 4, horas: 320, semanas: 8 },
  G: { complexidade: "Alto", sprints: 6, horas: 480, semanas: 12 },
};
// Dados fakes para Capacity
export const DEVELOPERS = [
  {
    nome: "Daniel França",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    atividadesExtras: ["Pesquisa Gen IA", "Review Experimento X"],
    experiments: [
      {
        nome: "Exp IA Claro",
        tamanho: "M",
        dataInicio: "2025-09-25",
        previsaoTermino: "2025-10-10",
        horas: 40,
        status: "Em andamento",
      },
      {
        nome: "Exp Web3",
        tamanho: "P",
        dataInicio: "2025-09-28",
        previsaoTermino: "2025-10-20",
        horas: 30,
        status: "Planejado",
      },
    ],
  },
  {
    nome: "Guilherme Raiol",
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    atividadesExtras: ["Review Experimento Y"],
    experiments: [
      {
        nome: "Exp FutureNet",
        tamanho: "G",
        dataInicio: "2025-09-26",
        previsaoTermino: "2025-10-15",
        horas: 50,
        status: "Em andamento",
      },
    ],
  },
  {
    nome: "Guilherme Magalhães",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
    atividadesExtras: ["Pesquisa Web3"],
    experiments: [
      {
        nome: "Exp Web3",
        tamanho: "G",
        dataInicio: "2025-09-27",
        previsaoTermino: "2025-10-25",
        horas: 60,
        status: "Em andamento",
      },
    ],
  },
  {
    nome: "Hugo",
    avatar: "https://randomuser.me/api/portraits/men/35.jpg",
    atividadesExtras: [],
    experiments: [
      {
        nome: "Exp Gen IA",
        tamanho: "G",
        dataInicio: "2025-09-29",
        previsaoTermino: "2025-10-30",
        horas: 70,
        status: "Planejado",
      },
    ],
  },
  {
    nome: "Luis",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    atividadesExtras: ["Review Experimento Z"],
    experiments: [
      {
        nome: "Exp Claro Labs",
        tamanho: "P",
        dataInicio: "2025-09-30",
        previsaoTermino: "2025-10-18",
        horas: 30,
        status: "Em andamento",
      },
    ],
  },
  {
    nome: "Pedro Porfirio",
    avatar: "https://randomuser.me/api/portraits/men/37.jpg",
    atividadesExtras: ["Pesquisa FutureNet"],
    experiments: [
      {
        nome: "Exp FutureNet",
        tamanho: "M",
        dataInicio: "2025-09-30",
        previsaoTermino: "2025-10-22",
        horas: 40,
        status: "Planejado",
      },
    ],
  },
  {
    nome: "Rogério Januário",
    avatar: "https://randomuser.me/api/portraits/men/38.jpg",
    atividadesExtras: [],
    experiments: [
      {
        nome: "Exp IA Claro",
        tamanho: "M",
        dataInicio: "2025-09-28",
        previsaoTermino: "2025-10-28",
        horas: 50,
        status: "Em andamento",
      },
    ],
  },
];

export const WEEKS = [
  { label: "Week 24", range: "Jun 12 - Jun 16" },
  { label: "Week 25", range: "Jun 19 - Jun 23" },
  { label: "Week 26", range: "Jun 26 - Jun 30" },
  { label: "Week 27", range: "Jul 03 - Jul 07" },
];

// Workload por semana (dados ilustrativos)
export const WORKLOAD = [
  // Cada item representa um dev, cada array interno representa as semanas
  [13, 0, 9, 7], // Daniel França
  [13, 0, 9, 7], // Guilherme Raiol
  [0, 10, 9, 10], // Guilherme Magalhães
  [13, 0, 9, 7], // Hugo
  [13, 0, 9, 7], // Luis
  [0, 10, 9, 10], // Pedro Porfirio
  [13, 0, 9, 7], // Rogério Januário
];

// Pie chart de domínio (exemplo)
export const DOMAIN_OVERVIEW = [
  { label: "Gen IA", value: 50, color: "#e11d48" },
  { label: "Web3", value: 25, color: "#6366f1" },
  { label: "FutureNet", value: 20, color: "#10b981" },
  { label: "Outros", value: 5, color: "#f59e42" },
];
