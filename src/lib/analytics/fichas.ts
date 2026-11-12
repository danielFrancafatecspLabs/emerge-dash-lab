/**
 * O conhecimento do Auditor de Analytics, escrito à mão: para cada conferência, a pergunta que ela responde, por que
 * importa, que números das telas dependem dela e como cada tela chega ao número. Para cada alerta de cadastro, por que
 * ele importa e o que fazer. O motor (consistencia.ts) faz as contas; estas fichas explicam o resultado.
 */

export interface Acao {
  /** Onde a correção acontece: no cadastro do Jira (o time) ou na regra do app (desenvolvimento). */
  onde: 'Jira' | 'App'
  texto: string
}

export interface Ficha {
  /** A pergunta que a conferência responde, em linguagem de quem lê os painéis. */
  pergunta: string
  porQueImporta: string
  /** Que números das telas saem errados quando esta conferência diverge. */
  afeta: string
  /** Como cada visão chega ao número (a chave é o nome da visão na conferência). */
  como: Record<string, string>
  /** O que está sendo contado, para as frases ("experimentos", "iniciativas"). */
  unidade?: [string, string]
  /** Onde mora a regra no app, para a ação de correção. */
  regraNoApp?: string
  /** Para contas que não fecham sem itens para apontar: o que costuma estar por trás e o que fazer. */
  seDivergir?: { explicacao: string; acoes: Acao[] }
}

const EXPERIMENTOS: [string, string] = ['experimento', 'experimentos']
const INICIATIVAS: [string, string] = ['iniciativa', 'iniciativas']
const REGRA_HIPOTESES = 'src/lib/hipoteses.ts'

const etapa = (nome: string, coluna: string): Ficha => ({
  pergunta: `Quantas iniciativas estão em ${nome}?`,
  porQueImporta: `${nome} é uma das três etapas que validam uma hipótese. Se as telas discordam de quem está nela, discordam também das hipóteses validadas.`,
  afeta: `Afeta o número de ${nome} no Semanal, no funil da Estratégia, no Portfólio e no Operacional, e as hipóteses validadas dos experimentos dessas iniciativas.`,
  unidade: INICIATIVAS,
  regraNoApp: REGRA_HIPOTESES,
  como: {
    Semanal: `Iniciativas cujo status é ${coluna} (pela regra única de hipóteses).`,
    'Estratégia (Tudo)': 'A mesma regra de hipóteses, aplicada às iniciativas do período "Tudo".',
    Portfólio: 'Os cartões de iniciativa, classificados pela mesma regra de hipóteses.',
    Operacional: 'O estágio do pipeline de cada iniciativa (pelo id e, na falta dele, pelo nome do status).',
  },
})

const etapaContraOJira = (nome: string): Ficha => ({
  pergunta: `A regra do app para ${nome} bate com a coluna do board no Jira?`,
  porQueImporta: 'A coluna do board é o que o time vê no Jira. Se a regra do app coloca a iniciativa em outra etapa, o painel mostra um número que ninguém reconhece no board.',
  afeta: `Afeta ${nome} em todas as telas e as hipóteses validadas dos experimentos dessas iniciativas.`,
  unidade: INICIATIVAS,
  regraNoApp: REGRA_HIPOTESES,
  como: {
    'Semanal (regra por status)': 'A regra de hipóteses do app: olha o id e o nome do status da iniciativa.',
    'Operacional (estágio)': 'O estágio do pipeline que o Operacional mostra.',
    'Coluna no Jira': 'A coluna do board de Ideação em que o status da iniciativa está configurado (a fonte independente).',
  },
})

const FICHAS: Record<string, Ficha> = {
  total: {
    pergunta: 'Todas as telas enxergam os mesmos experimentos?',
    porQueImporta: 'É a base de todas as outras contas. Se uma tela enxerga um experimento que a outra não, todos os números dela saem diferentes.',
    afeta: 'Afeta todos os números de experimentos: totais, funil, hipóteses e benefício.',
    unidade: EXPERIMENTOS,
    como: {
      Semanal: 'Todos os Epics lidos do board de Experimentação (o total do slide do Comitê).',
      'Estratégia (Tudo)': 'Os mesmos Epics, com o filtro de período em "Tudo".',
      Portfólio: 'Cada Epic vira um cartão de experimento.',
    },
  },
  validadas: {
    pergunta: 'Quantas hipóteses foram validadas, e são as mesmas em todas as telas?',
    porQueImporta: 'É o principal resultado do lab. A regra oficial: experimento concluído cuja iniciativa-mãe está em Aguardando piloto, Em piloto ou Em escala (Finalizado conta como Em escala).',
    afeta: 'Afeta "Hipóteses validadas", a taxa de validação e o benefício das validadas no Semanal, na Estratégia, no Portfólio e no Comparativo.',
    unidade: EXPERIMENTOS,
    regraNoApp: REGRA_HIPOTESES,
    como: {
      Semanal: 'A fatia "Hipóteses validadas" do slide do Comitê.',
      'Estratégia (Tudo)': 'A camada "Hipóteses validadas" do funil, com o período em "Tudo".',
      Portfólio: 'Os experimentos com o filtro Hipótese = Validada.',
      'Comparativo / benefício do Semanal': 'Os experimentos que entram no benefício das validadas (os mesmos do Comparativo).',
    },
  },
  refutadas: {
    pergunta: 'Quantas hipóteses foram refutadas, e são as mesmas em todas as telas?',
    porQueImporta: 'Refutada é o experimento concluído cuja iniciativa não seguiu para piloto. Junto com as validadas, tem de fechar com os concluídos.',
    afeta: 'Afeta "Hipóteses refutadas" e a taxa de validação em todas as telas.',
    unidade: EXPERIMENTOS,
    regraNoApp: REGRA_HIPOTESES,
    como: {
      Semanal: 'A fatia "Hipóteses refutadas" do slide do Comitê.',
      'Estratégia (Tudo)': 'A camada "Hipóteses refutadas" do funil.',
      Portfólio: 'Os experimentos com o filtro Hipótese = Refutada.',
      'Comparativo / benefício do Semanal': 'Os concluídos que ficam fora do benefício das validadas.',
    },
  },
  aguardando: etapa('Aguardando piloto', 'Aguardando piloto'),
  piloto: etapa('Em piloto', 'Em piloto'),
  escala: etapa('Em escala', 'Em escala ou Finalizado'),
  andamento: {
    pergunta: 'Quantos experimentos estão em execução agora?',
    porQueImporta: 'É a carga de trabalho do lab: experimentos em Em andamento ou Em validação.',
    afeta: 'Afeta "Em andamento" no Semanal e no funil da Estratégia, e a base dos bloqueados.',
    unidade: EXPERIMENTOS,
    como: {
      Semanal: 'A fase "Em andamento" (Em andamento + Em validação), sem os cancelados.',
      'Estratégia (Tudo)': 'As camadas "Em andamento" e "Em validação" do funil.',
    },
  },
  cancelados: {
    pergunta: 'Quantos experimentos foram cancelados, e são os mesmos em todas as telas?',
    porQueImporta: 'O cancelado sai do benefício potencial e das hipóteses. Um cancelado que uma tela não reconhece infla o benefício dela.',
    afeta: 'Afeta "Cancelados" e, principalmente, o benefício potencial de cada tela.',
    unidade: EXPERIMENTOS,
    regraNoApp: 'src/lib/mappers.ts (epicCancelado)',
    como: {
      Semanal: 'A fase "Cancelados": status de id 10015 ou com nome de cancelado/descontinuado.',
      'Estratégia (Tudo)': 'A camada "Cancelados" do funil, pela mesma regra.',
      Portfólio: 'Os cartões de experimento com situação "cancelado".',
    },
  },
  concluidos: {
    pergunta: 'Quantos experimentos foram concluídos, e são os mesmos em todas as telas?',
    porQueImporta: 'Concluído é a base das hipóteses: validadas + refutadas = concluídos.',
    afeta: 'Afeta "Concluídos", o gráfico de Crescimento e as hipóteses em todas as telas.',
    unidade: EXPERIMENTOS,
    regraNoApp: 'src/lib/concluido.ts',
    como: {
      Semanal: 'A fase "Concluídos": status Concluído (id 10019).',
      'Estratégia (Tudo)': 'A camada "Concluídos" do funil.',
      Crescimento: 'O último ponto do gráfico Crescimento da Experimentação.',
      Portfólio: 'Os cartões de experimento com situação "concluído".',
    },
  },
  beneficio: {
    pergunta: 'O benefício potencial é o mesmo na Estratégia e no Portfólio?',
    porQueImporta: 'É o número mais olhado do painel. Regra: soma do benefício de todos os experimentos, menos os cancelados.',
    afeta: 'Afeta o "Benefício Potencial" da Estratégia e o benefício do Portfólio.',
    como: {
      'Estratégia (Tudo)': 'Soma do benefício dos experimentos não cancelados, com o período em "Tudo".',
      'Portfólio (experimentos)': 'Soma do benefício dos cartões de experimento, sem os cancelados.',
    },
    seDivergir: {
      explicacao: 'As duas telas somam os mesmos experimentos com a mesma regra de cancelado. Quando o valor difere, uma delas está reconhecendo um cancelado que a outra não reconhece: veja a conferência "Cancelados", que aponta os itens.',
      acoes: [{ onde: 'App', texto: 'Fazer as duas telas usarem a mesma função de cancelado (src/lib/mappers.ts, epicCancelado).' }],
    },
  },
  'beneficio-pelo-nome': {
    pergunta: 'Algum experimento com status "Cancelado" está somando no benefício potencial?',
    porQueImporta: 'O Jira reaproveita o número (id) dos status entre boards. Um "Cancelado" com o id de outra etapa pode passar pela regra e inflar o benefício. Esta conta refaz a soma olhando só o nome do status.',
    afeta: 'Afeta o "Benefício Potencial" da Estratégia.',
    como: {
      'Estratégia (Tudo)': 'O benefício potencial que a tela mostra.',
      'Conta direta pelo nome do status': 'Soma refeita pelo Auditor, tirando todo experimento cujo nome de status diz cancelado ou descontinuado.',
    },
    seDivergir: {
      explicacao: 'O benefício da tela é maior que a conta pelo nome do status: há experimento com nome de cancelado entrando na soma. A diferença é exatamente o benefício desses experimentos.',
      acoes: [{ onde: 'App', texto: 'A regra de cancelado precisa valer pelo nome do status antes do id (src/lib/mappers.ts, epicCancelado e getPipelineStage).' }],
    },
  },
  'lista-beneficio-sem-cancelado': {
    pergunta: 'A lista "experimentos que contribuem para o benefício" tem algum cancelado?',
    porQueImporta: 'É a lista que abre ao clicar no benefício potencial. Um cancelado nela mostra que ele está na soma.',
    afeta: 'Afeta a credibilidade do "Benefício Potencial" da Estratégia.',
    como: {
      'Lista da Estratégia': 'Quantos itens da lista têm status com nome de cancelado ou descontinuado.',
      Esperado: 'Zero: cancelado nunca contribui para o benefício potencial.',
    },
    seDivergir: {
      explicacao: 'Há experimento cancelado na lista do benefício potencial. Ele está somando no total.',
      acoes: [{ onde: 'App', texto: 'Corrigir a regra de cancelado (src/lib/mappers.ts, epicCancelado).' }],
    },
  },
  'beneficio-iniciativas': {
    pergunta: 'No Portfólio, a visão de iniciativas e a de experimentos somam o mesmo benefício?',
    porQueImporta: 'As duas visões são o mesmo portfólio olhado de dois jeitos. A de iniciativas deixa de fora o experimento sem iniciativa e soma o benefício próprio da iniciativa sem experimento; descontado isso, tem de bater.',
    afeta: 'Afeta o benefício do Portfólio ao trocar entre Iniciativas e Experimentos.',
    como: {
      'Portfólio (iniciativas)': 'Soma do benefício dos cartões de iniciativa.',
      'Esperado pelos experimentos': 'Benefício dos experimentos, menos os sem iniciativa, mais o benefício próprio das iniciativas sem experimento.',
    },
    seDivergir: {
      explicacao: 'A soma das iniciativas não fecha com a dos experimentos mesmo descontando as duas diferenças conhecidas. Costuma ser iniciativa cancelada com experimento ativo (ou o contrário), que cada visão trata de um jeito.',
      acoes: [{ onde: 'App', texto: 'Rever como a iniciativa agrega o benefício dos filhos (src/lib/portfolio/dados.ts).' }],
    },
  },
  bloqueados: {
    pergunta: 'O Portfólio conta os mesmos bloqueados que a regra de bloqueio do app?',
    porQueImporta: 'Bloqueado é o experimento em execução (Em andamento ou Em validação) com sinal de bloqueio: flag, motivo, tipo de impedimento, etiqueta ou vínculo. É o que pede ação do executivo.',
    afeta: 'Afeta "Bloqueados" no Portfólio e os bloqueios do Semanal.',
    unidade: EXPERIMENTOS,
    regraNoApp: 'src/lib/bloqueio.ts',
    como: {
      Portfólio: 'Os cartões de experimento marcados como bloqueados.',
      'Regra do app (lib/bloqueio)': 'Experimentos em Em andamento ou Em validação (pelo id ou pelo nome do status) com algum sinal de bloqueio.',
    },
  },
  'fatias-semanal': {
    pergunta: 'As cinco fatias do slide do Comitê somam o total de experimentos?',
    porQueImporta: 'Exploração + andamento + validadas + refutadas + cancelados precisa dar o total: cada experimento está em uma fatia só.',
    afeta: 'Afeta o slide "beOn Labs" do Semanal.',
    como: {
      'Soma das fatias': 'A soma das cinco fatias do slide.',
      'Total de Epics': 'Quantos Epics foram lidos do board de Experimentação.',
    },
    seDivergir: {
      explicacao: 'A soma das fatias não dá o total: algum experimento está em duas fatias ou em nenhuma. Costuma ser um status que casa com duas regras (por exemplo, cancelado com id de outra etapa).',
      acoes: [{ onde: 'App', texto: 'Rever a ordem das regras das fatias (src/lib/semanal.ts e src/lib/weekly.ts): cancelado vem primeiro.' }],
    },
  },
  'coluna-aguardando': etapaContraOJira('Aguardando piloto'),
  'coluna-piloto': etapaContraOJira('Em piloto'),
  'coluna-escala': etapaContraOJira('Em escala'),
  'coluna-concluidos': {
    pergunta: 'Os concluídos do app são os mesmos da coluna Concluído do board?',
    porQueImporta: 'O app reconhece o concluído pelo id do status (10019). Se o board tiver outro status na coluna Concluído, esses experimentos ficam de fora das hipóteses.',
    afeta: 'Afeta "Concluídos" e as hipóteses validadas e refutadas.',
    unidade: EXPERIMENTOS,
    regraNoApp: 'src/lib/concluido.ts',
    como: {
      'Regra do app': 'Experimentos com o status Concluído (id 10019) e nome que não diz cancelado.',
      'Coluna no Jira': 'Experimentos cujo status está na coluna Concluído do board de Experimentação.',
    },
  },
  'coluna-cancelados': {
    pergunta: 'Os cancelados do app são os mesmos da coluna Cancelado do board?',
    porQueImporta: 'Cancelado sai do benefício potencial. Se o app e o board discordam, o benefício do painel não bate com o que o time vê no Jira.',
    afeta: 'Afeta "Cancelados" e o benefício potencial.',
    unidade: EXPERIMENTOS,
    regraNoApp: 'src/lib/mappers.ts (epicCancelado)',
    como: {
      'Regra do app': 'Experimentos com status de id 10015 ou nome de cancelado/descontinuado.',
      'Coluna no Jira': 'Experimentos cujo status está na coluna Cancelado do board de Experimentação.',
    },
  },
  'coluna-andamento': {
    pergunta: 'Os experimentos em execução do app são os mesmos das colunas de andamento e validação do board?',
    porQueImporta: 'É a carga atual do lab e a base dos bloqueados.',
    afeta: 'Afeta "Em andamento" e "Bloqueados".',
    unidade: EXPERIMENTOS,
    regraNoApp: 'src/lib/estrategia/resultados.ts (emAndamento, emValidacao)',
    como: {
      'Regra do app': 'Experimentos em Em andamento (id 3) ou Em validação (id 10204), pelo id ou pelo nome.',
      'Coluna no Jira': 'Experimentos cujo status está numa coluna de andamento ou de validação do board.',
    },
  },
  periodo: {
    pergunta: 'No período filtrado, o funil e o gráfico de Crescimento contam os mesmos concluídos?',
    porQueImporta: 'Os dois ficam lado a lado na Estratégia. Um concluído conta no período em que foi concluído.',
    afeta: 'Afeta a Estratégia ao trocar o filtro de período.',
    como: {
      'Funil (Estratégia)': 'A camada "Concluídos" do funil no período.',
      'Crescimento (+N no período)': 'Os concluídos dentro dos meses do gráfico de Crescimento.',
    },
    seDivergir: {
      explicacao: 'O funil e o gráfico usam janelas de datas diferentes para o mesmo período, ou um deles está usando a data de criação no lugar da de conclusão.',
      acoes: [{ onde: 'App', texto: 'Alinhar a janela do período nas duas contas (src/lib/periodo-filter.ts e getMesesDoPeriodo em src/lib/mappers.ts).' }],
    },
  },
  'semestres-beneficio': {
    pergunta: 'O benefício do 1º semestre mais o do 2º dá o benefício do ano?',
    porQueImporta: 'Cada experimento conta em um período só: o concluído pela conclusão, o cancelado pelo cancelamento e o aberto pela criação. Assim os semestres somam o ano.',
    afeta: 'Afeta o "Benefício Potencial" da Estratégia nos filtros de semestre e de ano.',
    como: {
      'Soma dos semestres': 'Benefício potencial com o filtro no 1º semestre, mais o do 2º.',
    },
    seDivergir: {
      explicacao: 'A soma dos semestres não dá o ano: algum experimento está contando nos dois semestres ou em nenhum. Costuma ser experimento sem a data que decide o período.',
      acoes: [{ onde: 'App', texto: 'Rever a data que decide o período (src/lib/estrategia/resultados.ts, dataDoExperimentoNoPeriodo).' }],
    },
  },
  'semestres-experimentos': {
    pergunta: 'Os experimentos do 1º semestre mais os do 2º dão os do ano?',
    porQueImporta: 'Mesmo motivo do benefício: nenhum experimento pode contar em dois períodos.',
    afeta: 'Afeta o total de experimentos da Estratégia nos filtros de semestre e de ano.',
    como: { 'Soma dos semestres': 'Experimentos com o filtro no 1º semestre, mais os do 2º.' },
    seDivergir: {
      explicacao: 'Algum experimento está em dois semestres ou em nenhum.',
      acoes: [{ onde: 'App', texto: 'Rever a data que decide o período (src/lib/estrategia/resultados.ts, dataDoExperimentoNoPeriodo).' }],
    },
  },
  'semestres-concluidos': {
    pergunta: 'Os concluídos do 1º semestre mais os do 2º dão os do ano?',
    porQueImporta: 'O concluído conta no semestre em que foi concluído.',
    afeta: 'Afeta "Concluídos" da Estratégia nos filtros de semestre e de ano.',
    como: { 'Soma dos semestres': 'Concluídos com o filtro no 1º semestre, mais os do 2º.' },
    seDivergir: {
      explicacao: 'Algum concluído está em dois semestres ou em nenhum.',
      acoes: [{ onde: 'App', texto: 'Rever a data que decide o período (src/lib/estrategia/resultados.ts, dataDoExperimentoNoPeriodo).' }],
    },
  },
  'comparativo-beneficio': {
    pergunta: 'O benefício potencial do ano é o mesmo no Comparativo e na Estratégia?',
    porQueImporta: 'As duas abas mostram o benefício potencial por ano. Têm de somar os mesmos experimentos, pela mesma data.',
    afeta: 'Afeta o cartão "Benefício potencial dos experimentos" do Comparativo e o report executivo.',
    como: {
      Comparativo: 'A soma do cartão de benefício do Comparativo no ano inteiro.',
    },
    seDivergir: {
      explicacao: 'O Comparativo e a Estratégia estão colocando algum experimento em anos diferentes. Costuma ser diferença na data usada (o Comparativo lê a conclusão no histórico do Jira; a Estratégia, a data do mapeamento).',
      acoes: [{ onde: 'App', texto: 'Alinhar a data do benefício nas duas abas (src/lib/comparativo/montar.ts, beneficioPotencial).' }],
    },
  },
  metas: {
    pergunta: 'Cada experimento não cancelado está em uma meta estratégica ou na lista "sem meta"?',
    porQueImporta: 'As três metas (EBITDA, NPS, Receita) mais os sem meta têm de somar os experimentos não cancelados: nenhum pode ficar de fora nem contar em duas metas.',
    afeta: 'Afeta os cartões de Metas Estratégicas da Estratégia.',
    como: {
      'Metas + sem meta': 'Experimentos em EBITDA + NPS + Receita + os sem meta.',
      'Experimentos não cancelados': 'Todos os experimentos, menos os cancelados.',
    },
    seDivergir: {
      explicacao: 'Algum experimento foi classificado numa categoria que não é uma das três metas, ou está contando em duas.',
      acoes: [{ onde: 'App', texto: 'Rever a agregação das metas (src/lib/estrategia/resultados.ts, metasAgregadas).' }],
    },
  },
}

const SEM_FICHA: Ficha = { pergunta: '', porQueImporta: '', afeta: '', como: {} }

/** A ficha da conferência: pelo id exato ou pelo id sem o sufixo variável (ano, tipo de período). */
export function fichaDe(id: string): Ficha {
  return FICHAS[id] ?? FICHAS[id.replace(/-\d{4}$/, '')] ?? FICHAS[id.split('-')[0]] ?? SEM_FICHA
}

// ── Alertas de cadastro ───────────────────────────────────────────────────────────────────────

/** corrigir: distorce um número; conferir: pode estar certo, vale olhar; informativo: explica um número, sem ação. */
export type Gravidade = 'corrigir' | 'conferir' | 'informativo'

export interface FichaDeAlerta { gravidade: Gravidade; porQueImporta: string; oQueFazer: Acao }

const FICHAS_DE_ALERTA: Record<string, FichaDeAlerta> = {
  'sem-iniciativa': {
    gravidade: 'corrigir',
    porQueImporta: 'Sem iniciativa-mãe o experimento nunca pode ser hipótese validada (a regra olha a etapa da iniciativa): se for concluído, conta como refutada. Também fica fora da visão de iniciativas do Portfólio.',
    oQueFazer: { onde: 'Jira', texto: 'Abrir cada experimento e preencher o campo Pai (Parent) com a iniciativa correspondente.' },
  },
  'mae-inexistente': {
    gravidade: 'corrigir',
    porQueImporta: 'O experimento aponta para uma iniciativa que não está no board de Ideação (outro projeto, arquivada ou vínculo errado). O app não enxerga a etapa dela, então trata o experimento como sem iniciativa.',
    oQueFazer: { onde: 'Jira', texto: 'Corrigir o campo Pai do experimento ou trazer a iniciativa para o board de Ideação.' },
  },
  'sem-dominio': {
    gravidade: 'conferir',
    porQueImporta: 'Sem domínio no experimento nem na iniciativa, ele cai em "Sem domínio" no mapa de Diretorias da Estratégia e some das quebras por área.',
    oQueFazer: { onde: 'Jira', texto: 'Preencher o campo Domínio no experimento ou na iniciativa-mãe.' },
  },
  'sem-meta': {
    gravidade: 'conferir',
    porQueImporta: 'A meta estratégica (EBITDA, NPS ou Receita) é atribuída por uma classificação de IA. Enquanto ela não roda, o experimento fica fora dos cartões de Metas da Estratégia.',
    oQueFazer: { onde: 'App', texto: 'Configurar a IA de classificação no servidor (LLM_API_KEY e LLM_API_BASE); a classificação roda sozinha na leitura seguinte.' },
  },
  'etapa-sem-concluido': {
    gravidade: 'informativo',
    porQueImporta: 'A iniciativa já está numa etapa que valida hipótese, mas nenhum experimento dela está concluído. Ela conta nas etapas (aguardando, piloto, escala) e não gera hipótese validada: explica por que as etapas têm mais itens do que as hipóteses.',
    oQueFazer: { onde: 'Jira', texto: 'Se o experimento já terminou, mover o Epic para Concluído; se a iniciativa foi direto para piloto sem experimento, está certo como está.' },
  },
  'bloqueio-fora': {
    gravidade: 'informativo',
    porQueImporta: 'Há sinal de bloqueio (flag, motivo, etiqueta) em experimento que não está em execução. Bloqueados conta só o que está em Em andamento ou Em validação, então estes ficam de fora.',
    oQueFazer: { onde: 'Jira', texto: 'Se o bloqueio já foi resolvido, limpar a flag ou o motivo; se o experimento está em execução, corrigir o status.' },
  },
  'ini-sem-coluna': {
    gravidade: 'corrigir',
    porQueImporta: 'Estas iniciativas estão num status que nenhuma coluna do board de Ideação mostra: somem do board no Jira, mas continuam contando no app.',
    oQueFazer: { onde: 'Jira', texto: 'Nas configurações do board de Ideação, arrastar o status para a coluna certa.' },
  },
  'ini-regra': {
    gravidade: 'corrigir',
    porQueImporta: 'A regra do app e a coluna do board discordam sobre a etapa destas iniciativas. É a origem mais comum de divergência nas etapas e nas hipóteses.',
    oQueFazer: { onde: 'App', texto: 'Decidir qual está certo. Se for a coluna, incluir o status na regra de hipóteses (src/lib/hipoteses.ts); se for a regra, mover o status de coluna no board.' },
  },
  'exp-sem-coluna': {
    gravidade: 'corrigir',
    porQueImporta: 'Estes experimentos estão num status que nenhuma coluna do board de Experimentação mostra: somem do board no Jira, mas contam no total do app.',
    oQueFazer: { onde: 'Jira', texto: 'Nas configurações do board de Experimentação, arrastar o status para a coluna certa.' },
  },
  'concluido-sem-data': {
    gravidade: 'conferir',
    porQueImporta: 'O histórico do Jira não trouxe a data em que o experimento foi concluído. Nos filtros de período ele conta pela data de criação, e pode aparecer no semestre ou no ano errado.',
    oQueFazer: { onde: 'Jira', texto: 'Costuma ser experimento criado já como Concluído. Se a data real importa, registrar a transição de status no Jira; senão, considerar a criação como aproximação.' },
  },
  'datas-incoerentes': {
    gravidade: 'corrigir',
    porQueImporta: 'A data de conclusão é anterior à de criação, o que não pode acontecer. Os tempos (lead e cycle time) destes experimentos saem negativos ou são descartados.',
    oQueFazer: { onde: 'Jira', texto: 'Conferir o histórico do experimento: provavelmente foi importado ou recriado.' },
  },
  'beneficio-concentrado': {
    gravidade: 'conferir',
    porQueImporta: 'Um único experimento responde por mais de 20% do benefício potencial. Se o valor cadastrado estiver errado (um zero a mais, valor de outro horizonte), o número principal do painel fica distorcido.',
    oQueFazer: { onde: 'Jira', texto: 'Confirmar com o dono do experimento o valor do campo Benefício Quantitativo.' },
  },
  'validadas-sem-beneficio': {
    gravidade: 'conferir',
    porQueImporta: 'A hipótese foi validada, mas o experimento não tem benefício cadastrado. O benefício das validadas fica menor do que o resultado real.',
    oQueFazer: { onde: 'Jira', texto: 'Preencher o campo Benefício Quantitativo dos experimentos validados.' },
  },
  'possiveis-duplicados': {
    gravidade: 'conferir',
    porQueImporta: 'Dois experimentos não cancelados com o mesmo nome podem ser o mesmo trabalho cadastrado duas vezes. Se os dois têm benefício, ele entra em dobro no benefício potencial.',
    oQueFazer: { onde: 'Jira', texto: 'Se forem ciclos diferentes, diferenciar o nome (por exemplo, "Ciclo 2"); se for duplicata, cancelar ou arquivar um deles.' },
  },
  'cancelados-com-beneficio': {
    gravidade: 'informativo',
    porQueImporta: 'Estes cancelados têm benefício cadastrado. Ele não entra no benefício potencial e aparece à parte na Estratégia ("Fora da conta"). Explica a diferença para uma soma simples do campo no Jira.',
    oQueFazer: { onde: 'Jira', texto: 'Nenhuma ação: é o comportamento esperado.' },
  },
  arquivadas: {
    gravidade: 'informativo',
    porQueImporta: 'Estas issues foram arquivadas no Jira. O app as tira de todas as contas na leitura. Explica um total menor do que o de leituras antigas.',
    oQueFazer: { onde: 'Jira', texto: 'Nenhuma ação: se alguma não devia estar arquivada, restaurar no Jira.' },
  },
}

const ALERTA_SEM_FICHA: FichaDeAlerta = { gravidade: 'conferir', porQueImporta: '', oQueFazer: { onde: 'Jira', texto: 'Abrir os itens no Jira e conferir o cadastro.' } }

/** A ficha do alerta: pelo id exato ou pelo prefixo (os alertas de status trazem o status no id). */
export function fichaDoAlerta(id: string): FichaDeAlerta {
  if (FICHAS_DE_ALERTA[id]) return FICHAS_DE_ALERTA[id]
  const prefixo = Object.keys(FICHAS_DE_ALERTA).find(k => id.startsWith(`${k}-`))
  return prefixo ? FICHAS_DE_ALERTA[prefixo] : ALERTA_SEM_FICHA
}
