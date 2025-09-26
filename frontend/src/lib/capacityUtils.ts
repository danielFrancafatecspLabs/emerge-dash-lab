// Funções utilitárias para cálculo de capacity mensal distribuído por experimentos

// Retorna array de datas dos dias úteis do mês (segunda a sexta)
export function getBusinessDays(year: number, month: number) {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Calcula o capacity total de horas úteis do mês
export function getMonthCapacity(year: number, month: number, hoursPerDay = 8) {
  return getBusinessDays(year, month).length * hoursPerDay;
}

// Distribui as horas de cada experimento ao longo dos meses
export function distributeExperimentHours(experiment, hoursPerDay = 8) {
  const start = new Date(experiment.dataInicio);
  const end = new Date(experiment.previsaoTermino);
  const totalHours = experiment.horas;
  // Meses envolvidos
  const months = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    months.push({ year: current.getFullYear(), month: current.getMonth() });
    current.setMonth(current.getMonth() + 1);
  }
  // Distribuição uniforme
  const hoursPerMonth = Math.ceil(totalHours / months.length);
  return months.map((m, i) => ({
    year: m.year,
    month: m.month,
    hours:
      i === months.length - 1
        ? totalHours - hoursPerMonth * (months.length - 1)
        : hoursPerMonth,
  }));
}

// Calcula o % de capacity usado por mês considerando todos os experimentos ativos
export function calculateMonthlyCapacity(dev, year, month, hoursPerDay = 8) {
  const monthCapacity = getMonthCapacity(year, month, hoursPerDay) * 0.7; // 70% para experimentos
  // Experimentos ativos neste mês
  const activeExperiments = dev.experiments.filter((exp) => {
    const start = new Date(exp.dataInicio);
    const end = new Date(exp.previsaoTermino);
    return (
      (start.getFullYear() < year ||
        (start.getFullYear() === year && start.getMonth() <= month)) &&
      (end.getFullYear() > year ||
        (end.getFullYear() === year && end.getMonth() >= month))
    );
  });
  // Divide o capacity igualmente entre os experimentos ativos
  const capacityPerExperiment = monthCapacity / (activeExperiments.length || 1);
  // Para cada experimento, calcula horas alocadas neste mês
  const experimentsCapacity = activeExperiments.map((exp) => {
    const dist = distributeExperimentHours(exp, hoursPerDay);
    const monthData = dist.find((d) => d.year === year && d.month === month);
    return {
      nome: exp.nome,
      horas: monthData ? monthData.hours : 0,
      percent: monthData ? (monthData.hours / capacityPerExperiment) * 100 : 0,
    };
  });
  // Soma total de horas usadas
  const totalUsed = experimentsCapacity.reduce((acc, e) => acc + e.horas, 0);
  const percentUsed = (totalUsed / monthCapacity) * 100;
  return {
    monthCapacity,
    totalUsed,
    percentUsed,
    experimentsCapacity,
<<<<<<< HEAD
    capacidadeTotalMes: monthCapacity,
=======
>>>>>>> c7e46de (feat: add capacity management components and functionality)
  };
}
