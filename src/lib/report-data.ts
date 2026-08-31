import type { IniciativaDelivery } from './types'

/**
 * Lista fixa de iniciativas de delivery definida pelo time BeOn Labs.
 * Mantida separada da lógica de renderização para facilitar manutenção.
 */
export const iniciativasDelivery: IniciativaDelivery[] = [
  {
    nome: 'Reajuste Telmex',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Aguardando GO/No Go para OK de Delivery com recurso da Carla Tiemi.',
    proximosPassos: 'Tomar decisão para delivery, estimar custos de infra e subir a iniciativa para produção.',
    sponsor: 'Carla Tiemi',
    dominio: 'Empresarial',
  },
  {
    nome: 'Smart Capex',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Aguardando GO/No Go para OK de Delivery com recurso da Carla Tiemi.',
    proximosPassos: 'Tomar decisão para delivery, estimar custos de infra e subir a iniciativa para produção.',
    sponsor: 'Heloisa Ubrig',
    dominio: 'Diretoria Estratégia',
  },
  {
    nome: 'Integridade do Produto',
    experimento: 'Sim',
    situacaoAtual: 'Contratação de Recursos e definição do plano em conjunto a Kamila Tairine.',
    proximosPassos: 'Começar o desenvolvimento a partir da segunda semana de Agosto.',
    sponsor: 'Patricia Mofato',
    dominio: 'Financeiro',
  },
  {
    nome: 'Logoff para WhatsApp',
    experimento: 'Sim',
    situacaoAtual: 'Execução de testes.',
    proximosPassos: 'Adquirir um hub USB de melhor qualidade; Contratar uma solução VPN; Aquisição de mais 22 aparelhos; Alocação de um desenvolvedor dedicado.',
    sponsor: 'Rodrigo Assad',
    dominio: 'TI',
  },
  {
    nome: 'Processamento de Manifestos',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Aguardando Go/No Go para Delivery.',
    proximosPassos: 'Executar Piloto.',
    sponsor: 'Felipe Takashi',
    dominio: 'Ouvidoria',
  },
  {
    nome: 'Automação para Resposta de Editais',
    experimento: 'Sim',
    situacaoAtual: 'Experimento Concluído. Decisão de Go para Delivery.',
    proximosPassos: 'Definir plano para rodar no Delivery.',
    sponsor: 'Heloisa Vieira',
    dominio: 'Engenharia',
  },
  {
    nome: 'Antispam',
    experimento: 'Sim',
    situacaoAtual: 'Realizar ajustes no App a partir da segunda quinzena de agosto.',
    proximosPassos: 'Realizar testes em conjunto ao Imusica.',
    sponsor: 'Gabriel Portugal',
    dominio: 'SVA',
  },
  {
    nome: 'Controle Parental',
    experimento: 'Não',
    situacaoAtual: 'Não definido plano para desenvolvimento.',
    proximosPassos: 'Definir plano para desenvolver em Delivery.',
    sponsor: 'Gabriel Portugal',
    dominio: 'SVA',
  },
]