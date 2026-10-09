import { DashboardData, EpicDetail, Iniciativa, JiraBoardConfiguration } from './types'
import type { ChangelogEntry } from './jira'
import { formatBeneficioMM, limparDescricao } from './report-utils'
import { buildGovernancaData, SAMPLE_GOVERNANCA_DATA, type GovernancaData } from './governanca'

const EPICOS_CANCELADOS_CSV = `Chave;Título;Descrição;Business Owner (BO);Sponsor;Iniciativa Pai;Data Cancelamento;Último Comentário;Link Jira
GL-817;Agente para Treinamento Comercial;Capacitar a força de vendas através de simulações conversacionais de atendimento e contorno de objeções guiadas por IA.;Ronaldo Domingues;Leandro Bueno;GL-809;26/09/2026 00:30;Direcionado para Dados & IA avaliar solução. Área de negócio optou por não seguir realizar experimentação no dia 25/09.;https://clarobr.atlassian.net/browse/GL-817
GL-714;Agentes de IA para QA;Implementação e validação de agentes inteligentes para suporte em esteiras de teste e garantia da qualidade de software.;Não definido;Não definido;GL-719;23/09/2026 18:21;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-714
GL-661;Leads PME - 2º Ciclo;Elevar a conversão de prospecção PME integrando os dados de contato enriquecidos da Neoway com a inteligência contextual do beOn labs.;Roberta Buzar;Roberta Buzar;GL-390;23/09/2026 18:14;Trocaram a carteira e precisamos de investimento em buscar dados desses clientes, experimento está em risco pela falta de engajamento do BO. Impasse com a Neoway.;https://clarobr.atlassian.net/browse/GL-661
GL-598;Cop Rede - RAG com MCP;Validar ação de Agente de IA na operação do COP REDE, realizando interações com os técnicos e verificando oportunidades de melhorias no suporte.;Wilson Vieira;Adiel Rodrigues;GL-597;23/09/2026 17:34;DESPRIORIZADO pela AREA de NEGOCIO;https://clarobr.atlassian.net/browse/GL-598
GL-632;Alarme situacional (Vendas);Geração de alertas e insights situacionais para alavancagem de vendas.;Cris Mattos;Não definido;GL-592;25/11/2025 14:35;Cancelado pois está contido no Alarme Situacional (Cancelamento e VT) utilizando a mesma estrutura e HLE.;https://clarobr.atlassian.net/browse/GL-632
GL-742;Uso de AgenteForce para venda de produtos moveis;Avaliar o uso do AgentForce na automação e recomendação de produtos e planos móveis.;Rodrigo Cerqueira;Não definido;GL-741;21/09/2026 15:42;05/03: Caso permanece com o time do Radakian. Experimento ainda será iniciado. EVANDRO DIAS HENRIQUES está acompanhando.;https://clarobr.atlassian.net/browse/GL-742
GL-738;Nova Alexa;Experimentos de integração com novas capacidades e skills do ecossistema Alexa.;TBD;TBD;GL-735;21/09/2026 15:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-738
GL-631;Piloto Agente Diagnóstico Financeiro;Piloto de IA para apoio e automação no diagnóstico de pendências financeiras e faturamento.;CELSO LUIZ TONET JUNIOR;Não definido;GL-630;21/09/2026 15:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-631
GL-822;Agente para Solução de Tickets da Rede Móvel;Agente de IA para suporte na triagem, diagnóstico e resolução de tickets de rede móvel.;João Roberto Ribeiro da Silva;Carlos Souza;GL-818;17/09/2026 01:08;Cancelado pela área de negócio 15/09. Responsável: Gabriel Rainha.;https://clarobr.atlassian.net/browse/GL-822
GL-658;Monitoramento com IA em Altura;Uso de Inteligência Artificial para monitorar, em tempo real, atividades em altura de técnicos próprios e terceiros.;Daniel Sato;Luís Elias Marun;GL-663;07/05/2026 14:58;Cancelamento definido follow up do dia 09/02. Ficha e Relatório sendo analisados pelo Laboratório.;https://clarobr.atlassian.net/browse/GL-658
GL-262;Conexão Logistica - Vídeos com IA;Análise e processamento de vídeos logísticos com recursos de visão computacional e IA.;Jessica Loene;Alexis Melo;GL-370;04/02/2026 16:47;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-262
GL-99;Contestação de Faturas;Automação e apoio à análise de processos de contestação de faturas de clientes.;Carla Tiemi;GUSTAVO SOARES SILBERT;GL-463;02/04/2026 09:42;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-99
GL-709;Analises de divergências de informações do RPA;Detecção e diagnóstico de inconsistências e desvios nas execuções de robôs RPA.;Joice Monuti;GUSTAVO SOARES SILBERT;GL-711;19/05/2026 11:40;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-709
GL-526;Copiloto para Produtos Digitais;Assistente inteligente para suporte e aceleração no desenvolvimento de produtos digitais.;Não definido;Rafael Boscolo;GL-525;06/11/2025 18:10;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-526
GL-807;M365;Adoção e integração de recursos avançados do Microsoft 365 e Copilot.;Ricardo Ferro;Rafael Boscolo;GL-587;22/05/2026 14:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-807
GL-896;GIA Inventário automático;Automatizar o preenchimento do inventário de contas por meio da integração entre a API corporativa e o Power Automate.;Enzo Kassawara;Rafael Felippe;GL-895;08/09/2026 09:10;Atualização completa da ferramenta GIA já em andamento pela equipe de Soluções Digitais, contemplando o escopo do experimento.;https://clarobr.atlassian.net/browse/GL-896
GL-217;Interface Gerência -TEO - CFM - OTS;Integração e centralização de interfaces operacionais entre sistemas TEO, CFM e OTS.;Não definido;Não definido;GL-389;02/09/2026 15:53;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-217
GL-917;URA Resolutiva;Evolução da URA tradicional para modelos conversacionais com foco em autoatendimento resolutivo.;Não definido;Não definido;GL-374;02/09/2026 15:50;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-917
GL-699;Simulador de Alçadas PME;Simulação automatizada de regras e alçadas comerciais para o segmento de pequenas e médias empresas.;Não definido;Não definido;GL-716;02/09/2026 15:42;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-699
GL-682;Quebra de Agenda;Previsão e mitigação de perdas e quebras de agendamentos em visitas técnicas.;Wellington Cobiaki;Carlos Souza;GL-681;02/09/2026 09:31;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-682
GL-623;Digital Worker;Automatizar a análise de reclamações e contestações de faturas através de um trabalhador digital integrado a múltiplas bases.;Celso Tonet;Celso Tonet;GL-622;01/09/2026 17:05;IBM refez experimento; POC concluída.;https://clarobr.atlassian.net/browse/GL-623
GL-520;Redução de Churn;Desenvolver modelos preditivos e ações preventivas automatizadas para mitigar o cancelamento voluntário de clientes.;Rodrigo Assad;Daniel Barros;GL-519;01/09/2026 16:59;Fórum com IBM (viés acadêmico). Squad em andamento com alinhamento diário com Daniel Barros.;https://clarobr.atlassian.net/browse/GL-520
GL-518;Vendedor Online (ecommerce e demais canais remotos);Implantar assistente virtual de vendas capaz de conduzir o fluxo completo de contratação remota de serviços e produtos Claro.;Rodrigo Assad;Rodrigo Assad;GL-517;01/09/2026 16:57;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-518
GL-103;Análise de validade de comprovante de buscas de pagamento;Automação via OCR/IA para validação e conferência de comprovantes de pagamento.;Alexandre Campos;Alexandre Campos;GL-461;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-103
GL-104;Utilização de IA para leitura e interpretação de documentos na análise de crédito PJ;Leitura, extração de entidades e checagem de conformidade de documentos PJ para esteiras de crédito.;Samir Oliveira;Samir Oliveira;GL-456;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-104
GL-105;Análise de Contratos;Extração e validação automatizada de cláusulas e termos em minutas contratuais.;Ilana;Ilana;GL-455;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-105
GL-106;Inteligência de Mercado;Coleta, estruturação e síntese de relatórios e sinais de mercado com suporte de IA.;Ilana;Ilana;GL-458;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-106
GL-107;Assistência Virtual para Tomada de Decisões;Painel e assistente para consolidação de KPIs executivos e suporte a decisões estratégicas.;Ilana;Ilana;GL-457;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-107
GL-102;Acelerar atendimento humano via Whatsapp;Sugestão contextual de respostas e automação de rotinas para operadores de atendimento via WhatsApp.;Wladmir;Wladmir;GL-462;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-102
GL-101;Análise Contratual;Padronização e conferência automatizada de documentos jurídicos e anexos contratuais.;João Antunes;João Antunes;GL-459;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-101
GL-94;URA RESOLUTIVA;Automação do fluxo da URA integrando backend de serviços e inteligência conversacional.;Sidney Neves;Sidney Neves;GL-466;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-94
GL-92;DIRECIONAMENTO ADAPTATIVO DA CHAMADA;Roteamento inteligente de chamadas baseado no perfil e histórico do cliente.;Sidney Neves;Sidney Neves;GL-468;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-92
GL-89;OMNICHANNEL;Unificação do contexto de atendimento entre múltiplos canais (app, web, voz, whatsapp).;Sidney Neves;Sidney Neves;GL-467;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-89
GL-86;MELHORIA DA QUALIDADE;Monitoria de qualidade automatizada em interações com clientes através de speech-to-text e NLP.;Sidney Neves;Sidney Neves;GL-371;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-86
GL-75;AUTOMAÇÃO DE ATIVIDADES;Automatização de processos operacionais repetitivos do atendimento.;Sidney Neves;Sidney Neves;GL-380;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-75
GL-73;TREINAMENTOS E RECICLAGENS;Plataforma assistida por IA para onboarding, reciclagem e teste de atendentes.;Sidney Neves;Sidney Neves;GL-384;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-73
GL-70;Bot Vendedor;Agente virtual especializado em conversão e fechamento de ofertas no ambiente digital.;Rogerio Ahouagi;Rogerio Ahouagi;GL-387;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-70
GL-69;Gen AI - Esteira de Privacy by Design;Mecanismos automatizados para governança, mascaramento e conformidade de privacidade em soluções de IA Generativa.;JOÃO GASTALDELLI;JOÃO GASTALDELLI;GL-388;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-69
GL-67;Atendimento por Voz (Respostas do KB);Assistente de voz alimentado pela base de conhecimento oficial para dúvidas de suporte.;Celso Tonet;Celso Tonet;GL-394;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-67
GL-66;Assistente AI;Copiloto de produtividade para equipes internas de operação.;Caio Barreiro- Bain;Caio Barreiro- Bain;GL-395;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-66
GL-65;Interactions analytics;Análise semântica e comportamental em larga escala de interações telefônicas e digitais.;Caio Barreiro- Bain;Caio Barreiro- Bain;GL-393;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-65
GL-64;Assistencia em lojas;Apoio ao consultor de loja física com informações rápidas sobre planos e aparelhos.;Caio Barreiro- Bain;Caio Barreiro- Bain;GL-396;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-64
GL-63;Leitura textual: de todos os documentos da Anatel;Processamento massivo e indexação vetorial de regulamentações e publicações da Anatel.;Maria do Carmo;Maria do Carmo;GL-398;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-63
GL-48;Análise de resolução de Problemas;Classificação e diagnósticos automáticos de causa raiz em falhas técnicas relatadas.;Camilo;Camilo;GL-429;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-48
GL-42;Upscaling / Downscaling na transmissão de vídeo;Otimização inteligente da compressão e taxa de bits de streaming de vídeo.;Oliver;Oliver;GL-430;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-42
GL-39;Finep é STT/TTS Português Brasil;Projeto de P&D Finep para desenvolvimento de modelos próprios de fala e síntese de voz em PT-BR.;Assad;Assad;GL-436;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-39
GL-38;Finep - LLM Específica para Atendimento;Desenvolvimento de modelo de linguagem ajustado para termos técnicos e atendimento de telecom.;Assad;Assad;GL-437;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-38
GL-37;Finep - LLM Genérica Otimizada;Arquitetura e infraestrutura de inferência eficiente para modelos generativos em larga escala.;Assad;Assad;GL-442;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-37
GL-36;LLM Cache;Estratégia de cache semântico de respostas de LLMs para redução de custo e latência de inferência.;Marco Aurélio;Marco Aurélio;GL-443;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-36
GL-28;Agente de IA para Colaboradores;Assistente interno corporativo para suporte a dúvidas de RH, TI e processos internos.;Carlos Mendes / Luciene / Gaiotto;Carlos Mendes / Luciene / Gaiotto;GL-403;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-28
GL-25;Análise de Contatos de Retenção - Motivo Cancelamento;Mineração de dados de ligações e chats de retenção para identificação preditiva de ofensores.;Andreia Maldonado;Andreia Maldonado;GL-406;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-25
GL-19;Cálculo Trabalhista;Automação de planilhas e cálculos de contingências trabalhistas via algoritmos dedicados.;Paulo Viveiros / Poliana;Paulo Viveiros / Poliana;GL-416;12/03/2025 11:18;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-19
GL-18;Análise de Comentários das lojas de apps;Classificação de sentimento e tópicos das avaliações dos aplicativos Minha Claro e Claro TV+.;Mario Rachid;Mario Rachid;GL-421;22/04/2026 15:52;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-18
GL-108;chat inteligente para duvidas do portal de notas e retenções fiscais;Chatbot para esclarecimento de regras tributárias e emissão de notas fiscais.;Rodrigo Bazo;Rodrigo Bazo;GL-454;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-108
GL-109;IA em CO PILOTO para validação de documentos;Copiloto para auditoria e conferência cadastral de documentos anexos.;Alexandre Vailatti;Alexandre Vailatti;GL-453;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-109
GL-110;Chat TOA;Assistente de suporte às operações de campo com integração ao Oracle Field Service (TOA).;Wilson Luiz Vieira;Wilson Luiz Vieira;GL-452;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-110
GL-111;Chat DTC;Canal conversacional integrado ao sistema DTC para dúvidas técnicas.;Rafael Gallao;Rafael Gallao;GL-449;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-111
GL-112;Veracidade de Fotos de Vandalismo;Visão computacional para autenticação e detecção de fraudes em fotos de cabos e estruturas vandalizadas.;Paulo R Soares Furtado;Paulo R Soares Furtado;GL-448;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-112
GL-113;Validações de correções mecânica;Validação visual assistida por IA de reparos e intervenções técnicas na rede externa.;Paulo R Soares Furtado;Paulo R Soares Furtado;GL-451;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-113
GL-114;Chatbot no Portal de Processos;Agente conversacional para navegação e consultas à documentação do portal de processos.;Dailane Vasconcelos;Dailane Vasconcelos;GL-450;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-114
GL-115;Análise as características do(s) produto(s);Comparador automático e sumarizador de fichas técnicas de produtos e ofertas.;Edna Félix;Edna Félix;GL-444;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-115
GL-116;Roteiro de video Puxadas de Venda e palestras;Geração e sugestão de scripts de comunicação e pitches comerciais com Gen AI.;Pâmella Lopes;Pâmella Lopes;GL-447;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-116
GL-132;SD-WAN: Jornada do Consultor de Soluções;Mapeamento e otimização das etapas de venda técnica e configuração de SD-WAN corporativo.;Não definido;Não definido;GL-375;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-132
GL-133;SD-WAN - Busca cruzada;Mecanismo de busca cruzada e correlação de logs de telemetria de redes SD-WAN.;Não definido;Não definido;GL-373;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-133
GL-211;CoE EA;Iniciativas de arquitetura empresarial suportadas pelo Centro de Excelência.;Giovana Arquitetura;Não definido;GL-435;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-211
GL-212;Análise de Proposta de Fornecedores;Automação da leitura e comparação de tabelas de preços e minutas comerciais de fornecedores.;Não definido;Não definido;GL-324;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-212
GL-218;Automação de RFQs;Agilização no preenchimento e respostas técnicas em processos concorrenciais de compras (RFQs).;Heloisa;Márcio Nunes;GL-392;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-218
GL-219;COE - Qualidade de Código com IA;Uso de ferramentas generativas para auditoria estática e boas práticas de desenvolvimento.;Não definido;Não definido;GL-391;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-219
GL-221;Pauta na ATA das reuniões/comitês;Geração automática de atas e extração de compromissos a partir de transcrições de reuniões.;Não definido;Não definido;GL-385;03/11/2025 15:00;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-221
GL-222;Controle nos Status dos Projetos;Consolidação preditiva de cronogramas e alertas de desvios em portfólio de projetos.;Não definido;Não definido;GL-382;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-222
GL-223;OBZ com payback acima de 3 anos;Modelagem e priorização de iniciativas no modelo de Orçamento Base Zero.;Não definido;Não definido;GL-407;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-223
GL-713;Oportunidades IA no fluxo PLM;Identificação de pontos de automação e ganhos no ciclo de vida de produtos (PLM).;Não definido;Não definido;GL-718;04/08/2026 09:12;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-713
GL-265;Atendimento por Voz na URA (Inadimplência);URA cognitiva específica para negociação, parcelamento e regularização de faturas em atraso.;Bienis;Bienis;GL-365;24/03/2026 15:00;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-265
GL-645;CNPJ Alfanumerico;Adequação dos sistemas de cobrança, faturamento e cadastro ao novo formato de CNPJ alfanumérico.;Não definido;Não definido;GL-644;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-645
GL-662;Gameficação no Minha Claro;Mecanismos de engajamento e fidelização através de desafios e recompensas no app.;Não definido;Não definido;GL-668;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-662
GL-656;IA para Mercado Desenvolvimento;Solução de IA para prospecção de novas contas e identificação de tendências no mercado corporativo.;Não definido;Não definido;GL-665;09/02/2026 14:00;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-656
GL-648;Jornada Delta;Otimização da jornada digital e presencial integrada em rotinas de campo.;Roberto Canuto;Jessica Varçal;GL-666;03/08/2026 11:14;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-648
GL-672;Monitoramento de Consumo de Materiais;Controle inteligente de estoque e previsão de consumo de insumos por técnicos de campo.;Edgar Ribeiro;Não definido;GL-671;06/07/2026 17:00;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-672
GL-687;[Experimento] - Logoff Whatsapp;Validação do impacto operacional e de satisfação do logout assistido em canais de atendimento.;Não definido;Não definido;GL-473;25/03/2026 11:06;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-687
GL-715;[Experimento] - RPA "com" IA;Evolução de robôs legados com agentes cognitivos para tratamento de exceções em processos.;Não definido;Não definido;GL-711;02/04/2026 09:41;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-715
GL-778;[Experimento] - Agente de IA para QA;Laboratório de testes automatizados com geração dinâmica de cenários e asserções via IA.;Não definido;Não definido;GL-719;22/06/2026 10:35;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-778
GL-514;Claro GPT - Análise de dados do Call Center e Bases IN;Utilização do Claro GPT para cruzamento de métricas operacionais e bases de inteligência de rede.;Rodrigo Assad;Rodrigo Assad;GL-513;18/12/2025 10:22;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-514
GL-634;Homologação de Faturamento NFCOM nas faturas;Validação e compliance do faturamento eletrônico com a Nota Fiscal de Comunicação (NFCOM).;Francis David;Juliano Martins;GL-633;13/03/2026 11:20;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-634
GL-119;Previsão de Custos e Duração de Demandas de TI;Modelos de regressão e ML para estimativa de esforço e custo de projetos de tecnologia.;Gustavo Barreto;Cesar;GL-397;30/10/2025 00:37;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-119
GL-739;RAG na Ativação Simplificada;Mecanismo RAG para consulta de procedimentos rápidos durante a ativação simplificada de planos.;Não definido;Não definido;GL-736;06/07/2026 17:47;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-739
GL-26;Open WebUI;Interface de chat web corporativa para múltiplos modelos de inteligência artificial aberta.;Gaiotto;Gaiotto;GL-401;12/03/2025 11:18;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-26
GL-261;Análise de Vídeo para Autoinstalação;Visão computacional para orientar e validar a correta instalação de modems e decodificadores pelo próprio cliente.;Não definido;Não definido;GL-361;02/04/2026 09:34;Sem comentários registrados.;https://clarobr.atlassian.net/browse/GL-261`

function normalizeEpicTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function parseMotivosCanceladosCsv(csv: string): Map<string, string> {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return new Map()

  const headers = lines[0].split(';').map(h => h.trim())
  const tituloIndex = headers.findIndex(h => /título|titulo/i.test(h))
  const motivoIndex = headers.findIndex(h => /motivo|último comentário|ultimo comentario|comentario/i.test(h))
  if (tituloIndex === -1 || motivoIndex === -1) return new Map()

  const map = new Map<string, string>()
  for (const line of lines.slice(1)) {
    const cells = line.split(';')
    const titulo = (cells[tituloIndex] ?? '').trim()
    const motivo = (cells[motivoIndex] ?? '').trim()
    if (!titulo || !motivo || /sem comentários registrados|sem comentarios registrados/i.test(motivo)) continue
    map.set(normalizeEpicTitle(titulo), motivo)
  }
  return map
}

const MOTIVOS_CANCELADOS_POR_EPIC = parseMotivosCanceladosCsv(EPICOS_CANCELADOS_CSV)

export function resolveMotivoBloqueio(epicNome: string, jiraMotivo?: string | null): string | null {
  const nomeNormalizado = normalizeEpicTitle(epicNome)
  const motivoDoCsv = MOTIVOS_CANCELADOS_POR_EPIC.get(nomeNormalizado)
  if (motivoDoCsv) return motivoDoCsv

  const motivo = (jiraMotivo ?? '').trim()
  return motivo || null
}

export interface WeeklyStageMotivo {
  motivo: string
  count: number
}

export interface WeeklyExperimentoRow {
  key: string
  nome: string
  objetivo: string
  fase: string
  statusId: string
  statusNome: string
  sponsor: string
  dominio: string
  beneficioLabel: string
  prioridade: string | null
  timeResponsavel: string | null
  duedate: string | null
  motivoBloqueio: string | null
}

export interface WeeklyStage {
  id: string
  label: string
  descricao: string
  quantidade: number
  motivos?: WeeklyStageMotivo[]   // top motivos (só preenchido na fase "Cancelados")
  experimentos: WeeklyExperimentoRow[]   // lista detalhada — usada no "Ver detalhes" de cada fase
}

export interface WeeklyRanking {
  nome: string
  count: number
}

export interface WeeklyData {
  geradoEm: string
  governanca: GovernancaData          // slide 1 — swimlane por Domínio × fase da jornada
  stages: WeeklyStage[]              // funil: Backlog -> Em andamento -> Cancelados -> Concluídos -> Aguardando piloto -> Piloto -> Em escala
  pendenteAnalise: WeeklyStage        // Iniciativas do board de Ideação em Backlog/Em refinamento — ideias que ainda não viraram experimento (não faz parte do funil, fica à parte)
  beneficioTotal?: number            // resumo da aba Estratégia, exposto para o slide semanal
  metasAgregadas?: DashboardData['metasAgregadas']
  experimentosAprovados: number      // total de Epics no board de Experimentação (data.allEpics.length) — usado no slide de entrada
  emAndamentoMaisConcluidos: number  // Em andamento + Concluídos — a fatia dos experimentos aprovados já em execução real ou finalizada
  totalEpics: number
  totalIniciados: number
  taxaOportunidadesParaExperimentos: number
  conversaoPiloto: number
  conversaoEscala: number
  conversaoPilotoNumerador: number   // iniciativas já em Piloto ou Em escala (numerador da conversaoPiloto)
  conversaoEscalaNumerador: number   // iniciativas já em Em escala (numerador da conversaoEscala)
  conversaoDenominador: number       // total de experimentos aprovados (mesmo total do slide 1 — total de Epics)
  semBeneficio: { count: number; pct: number }
  semSponsor: { count: number; pct: number }
  topSponsors: WeeklyRanking[]       // top 6 sponsors por quantidade de experimentos (todas as fases do funil)
  topDiretorias: WeeklyRanking[]     // top 6 diretorias/domínios por quantidade de experimentos (idem)
  experimentosConcluidos: number     // Epics no board de Experimentação com status Concluído
  experimentosCancelados: number     // Epics no board de Experimentação com status Cancelado
  aprendizadosSemEscalar: number     // Concluídos - (Aguardando piloto + Piloto + Em escala): geraram aprendizado mas não seguiram adiante
  aprendizadosAcionaveis: number
  insightPrincipal: string    // maior gargalo do funil (conversão piloto -> escala)
  insightSecundario: string   // segundo risco em destaque (motivo de cancelamento ou backlog parado)
  isSample: boolean
}

function pct(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

// Os dois insights do rodapé existem para apontar PROBLEMAS/riscos do
// funil — não para recapitular estatísticas já mostradas nos cards acima.
function buildInsights(
  conversaoPiloto: number,
  conversaoEscala: number,
  canceladosCount: number,
  topMotivo: WeeklyStageMotivo | undefined,
  backlogCount: number,
): { principal: string; secundario: string } {
  const presoNoPiloto = Math.max(0, conversaoPiloto - conversaoEscala)
  const principal = `Gargalo na escala: apenas ${conversaoEscala}% dos experimentos aprovados chega à implementação, mesmo com ${conversaoPiloto}% já validados em piloto — ${presoNoPiloto} pontos percentuais ficam presos na transição.`
  const secundario = topMotivo
    ? `"${topMotivo.motivo}" já responde por ${topMotivo.count} dos ${canceladosCount} cancelamentos (${pct(topMotivo.count, canceladosCount)}%) — maior risco de continuidade identificado no período.`
    : `${backlogCount} experimentos aprovados ainda não saíram do backlog — risco de perder tração se não forem priorizados.`
  return { principal, secundario }
}

function semBeneficioPotencial(e: EpicDetail): boolean {
  const semQuantitativo = (e.beneficioQuantitativo ?? 0) <= 0
  const semQualitativo = !e.beneficioQualitativo || !e.beneficioQualitativo.trim()
  return semQuantitativo && semQualitativo
}

/**
 * Mapa status.id -> nome REAL da coluna no board 2735 (Experimentação), a
 * partir da configuração live do board (GET /board/2735/configuration).
 */
function buildColunaPorStatusId(boardConfig?: JiraBoardConfiguration): Map<string, string> {
  const map = new Map<string, string>()
  const columns = boardConfig?.columnConfig?.columns
  if (!Array.isArray(columns)) return map
  for (const col of columns) {
    const nome = (col?.name ?? '').toString().trim().toUpperCase()
    for (const s of col?.statuses ?? []) {
      if (s?.id) map.set(s.id, nome)
    }
  }
  return map
}

/**
 * Linhas de detalhe por fase, para o "Ver detalhes" do funil. As fases
 * Backlog/Aguardando piloto/Piloto/Em escala vêm de Iniciativas (board de
 * Ideação — sem campos ricos próprios, por isso usamos os agregados dos
 * Epics filhos: sponsor/dominio/benefício). Em andamento/Cancelados/
 * Concluídos vêm direto dos Epics (board de Experimentação, fonte dos
 * dados ricos de negócio).
 */
/**
 * Normaliza o nome de um status do Jira para exibição amigável.
 * Ex.: "Em refinamento (migrated)" → "Em refinamento"
 */
function normalizarFase(nome: string): string {
  const lower = nome.toLowerCase()
  if (lower.startsWith('em refinamento')) return 'Em refinamento'
  return nome
}

/** Ordem de prioridade Jira para ordenação. */
const PRIORITY_SORT_ORDER: Record<string, number> = {
  Highest: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Lowest: 4,
}

/**
 * Ordena experimentos por prioridade (Highest → Lowest) e, para High e Medium,
 * desempata pelo lab responsável (timeResponsavel).
 */
function sortByPrioridadeELab(rows: WeeklyExperimentoRow[]): WeeklyExperimentoRow[] {
  return [...rows].sort((a, b) => {
    const pa = PRIORITY_SORT_ORDER[a.prioridade ?? ''] ?? 99
    const pb = PRIORITY_SORT_ORDER[b.prioridade ?? ''] ?? 99
    if (pa !== pb) return pa - pb

    // Para High (1) e Medium (2), desempata pelo lab responsável
    const precisaDesempate = (p: number) => p === 1 || p === 2
    if (precisaDesempate(pa) && precisaDesempate(pb)) {
      const la = (a.timeResponsavel ?? '').toLowerCase()
      const lb = (b.timeResponsavel ?? '').toLowerCase()
      if (la < lb) return -1
      if (la > lb) return 1
    }

    return 0
  })
}

function rowFromIniciativa(i: Iniciativa): WeeklyExperimentoRow {
  return {
    key: i.key,
    nome: i.nome,
    objetivo: limparDescricao(i.descricao),
    fase: normalizarFase(i.status.name),
    statusId: i.status.id,
    statusNome: i.status.name,
    sponsor: i.sponsor ?? i.sponsors[0] ?? '—',
    dominio: i.dominio ?? i.dominios[0] ?? '—',
    beneficioLabel: formatBeneficioMM(i.beneficioQuantitativoTotal || i.beneficioQuantitativo),
    prioridade: null,
    timeResponsavel: i.timeResponsavel ?? null,
    duedate: null,
    motivoBloqueio: null,
  }
}

function rowFromEpic(e: EpicDetail, parentLabLookup?: Map<string, string | null>, epicChangelogs?: Record<string, ChangelogEntry[]>): WeeklyExperimentoRow {
  // O lab responsável vem do campo "Lab Responsável" da Iniciativa-pai,
  // não do próprio épico. Se o pai não tiver lab definido, usa o do épico
  // como fallback.
  const labDaIniciativa = parentLabLookup?.get(e.parentKey ?? '') ?? undefined
  const motivoBloqueio = resolveMotivoBloqueio(
    e.nome,
    e.motivoBloqueio ?? getMotivoDoChangelog(e.key, epicChangelogs ?? {})
  )

  return {
    key: e.key,
    nome: e.nome,
    objetivo: limparDescricao(e.descricao),
    fase: normalizarFase(e.status.name),
    statusId: e.status.id,
    statusNome: e.status.name,
    sponsor: e.sponsor ?? '—',
    dominio: e.dominio ?? '—',
    beneficioLabel: formatBeneficioMM(e.beneficioQuantitativo),
    prioridade: e.prioridade ?? null,
    timeResponsavel: labDaIniciativa ?? e.timeResponsavel ?? null,
    duedate: e.duedate ?? null,
    motivoBloqueio,
  }
}

/**
 * Ranking (top N) de quantos experimentos cada valor de um campo concentra,
 * considerando TODAS as fases do funil (mesmo universo do total de
 * Experimentos Aprovados). Valores vazios/não identificados ("—") ficam de
 * fora do ranking — aparecem à parte, no card "Sem sponsor identificado".
 */
function buildRanking(rows: WeeklyExperimentoRow[], campo: 'sponsor' | 'dominio', limite = 6): WeeklyRanking[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const valor = r[campo]
    if (!valor || valor === '—') continue
    counts.set(valor, (counts.get(valor) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([nome, count]) => ({ nome, count }))
}

/**
 * Extrai o último motivo preenchido no campo "Motivo de Bloqueio"
 * (customfield_13406) a partir do changelog do Epic. Usado nos Cancelados
 * porque o campo costuma ser o mesmo usado para registrar o motivo antes do
 * cancelamento, e pode já ter sido limpo no valor atual do campo — o
 * changelog preserva o último valor setado.
 */
function getMotivoDoChangelog(epicKey: string, changelogs: Record<string, ChangelogEntry[]>): string | null {
  const changelog = changelogs[epicKey]
  if (!changelog || changelog.length === 0) return null

  const sorted = [...changelog].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  )

  let ultimoMotivo: string | null = null
  for (const entry of sorted) {
    for (const item of entry.items) {
      const fieldIdMatch = item.fieldId === 'customfield_13406'
      const fieldName = typeof item.field === 'string' ? item.field : ''
      const fieldNameMatch = fieldName === 'customfield_13406' || /motivo.*bloqueio/i.test(fieldName)
      if (!fieldIdMatch && !fieldNameMatch) continue

      const to = item.toString?.trim()
      if (to && to !== 'None' && to !== 'null') ultimoMotivo = to
    }
  }
  return ultimoMotivo
}

/**
 * Top motivos de cancelamento: para cada Epic cancelado, usa o valor atual
 * do campo "Motivo de Bloqueio" e, se vazio, cai para o último valor
 * encontrado no changelog. Agrupa por motivo e retorna os 3 mais frequentes.
 */
function buildTopMotivosCancelamento(
  canceladosEpics: EpicDetail[],
  epicChangelogs: Record<string, ChangelogEntry[]>
): WeeklyStageMotivo[] {
  const counts = new Map<string, number>()
  for (const e of canceladosEpics) {
    const motivo = resolveMotivoBloqueio(
      e.nome,
      e.motivoBloqueio ?? getMotivoDoChangelog(e.key, epicChangelogs)
    )
    if (!motivo) continue
    counts.set(motivo, (counts.get(motivo) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([motivo, count]) => ({ motivo, count }))
}

/**
 * Mapeamento acordado com o time BeOn Labs para o slide Weekly (v7). Reusa os
 * MESMOS filtros por id+nome de status já usados em src/app/report/page.tsx
 * (funilStages / totalExperimentosIniciados / conversaoPiloto / conversaoEscala)
 * em vez do mapa STATUS_PIPELINE — aquele mapa ficou incompleto/desatualizado
 * em relação aos status reais do board e subcontava "Em andamento".
 *
 * O funil de pipeline ganhou 2 fases logo após "Em andamento": Cancelados e
 * Concluídos (ambas do board de Experimentação). "Ideias Qualificadas" saiu
 * do funil e virou "Experimentos Aprovados" — a métrica de saída do slide de
 * entrada (Solicitação/Iniciativas -> Critérios de Entrada -> Experimento
 * aprovado).
 *
 * - Backlog: Epics do board de Experimentação em "BACKLOG" (id 10004) +
 *   "Em refinamento" (id 10139) — experimentos JÁ aprovados, só não começaram.
 *   Não confundir com "Pendente para Análise" (ver abaixo), que são as
 *   Iniciativas do board de Ideação, ainda não viraram experimento.
 * - Aguardando piloto / Piloto / Em escala: Iniciativas nos respectivos
 *   status do board de Ideação.
 * - Em andamento: Epics em "Em andamento" (id 3) + "Em validação"/"EM VALIDAÇÃO" (id 10204).
 * - Cancelados: Epics em "Cancelado"/"CANCELADO" (id 10015, não confirmado
 *   nesse board — ajustar se o id real for outro). O card traz os 3
 *   principais motivos, extraídos do campo "Motivo de Bloqueio"
 *   (customfield_13406) — valor atual ou, se limpo, último valor do changelog.
 * - Concluídos: Epics em status concluído (id 10019).
 * - Experimentos Aprovados: total de Epics no board de Experimentação
 *   (data.allEpics.length) — MESMA definição de "Total de Experimentos" do
 *   Funil de Experimentos na aba Estratégia (ver FunilExperimentos.tsx).
 *   NÃO é a soma das fases do funil da pipeline acima: Backlog/Aguardando/
 *   Piloto/Escala são Iniciativas (board de Ideação), um universo diferente.
 * - Conversão para Piloto/Escala: numerador = iniciativas que já chegaram àquele
 *   marco (data.pilotoStatusIds / data.escalaStatusIds, igual à aba Estratégia);
 *   denominador = SEMPRE o total de Experimentos Aprovados (mesmo número do slide 1),
 *   não o total bruto de iniciativas do board de Ideação.
 * - Sem benefício potencial / Sem sponsor: sobre TODOS os Epics do board de
 *   Experimentação — benefício considera os campos quantitativo E qualitativo juntos.
 * - Pendente para Análise: Iniciativas do board de Ideação em "BACKLOG"
 *   (id 10057) + "EM REFINAMENTO" (id 14538) — ideias que ainda não passaram
 *   pelos critérios de entrada, portanto ainda não são um experimento.
 * - Em andamento + Concluídos: a soma das duas fases representa quanto do
 *   total de Experimentos Aprovados (slide 1) já está em execução real ou já
 *   foi concluído — Backlog (não começou) e Cancelados (não seguiu) ficam de
 *   fora dessa leitura.
 */
export function buildWeeklyData(data: DashboardData, epicChangelogs: Record<string, ChangelogEntry[]> = {}, board2735Config?: JiraBoardConfiguration): WeeklyData {
  // Pendente para Análise: Iniciativas do board de Ideação (2734) em
  // BACKLOG (10057) + EM REFINAMENTO (14538) — ideias que ainda não
  // passaram pelos critérios de entrada, portanto ainda não são um
  // experimento. Usa IDs fixos porque o board de Ideação tem mapeamento
  // próprio e estável.
  const ideacaoBacklogIds = new Set(['10057', '14538'])
  const pendenteAnaliseInis = data.iniciativas.filter(i =>
    ideacaoBacklogIds.has(i.status.id)
  )

  // Backlog do slide 2: apenas Epics do board de Experimentação (2735)
  // cujo status pertence à coluna BACKLOG ou REFINAMENTO no board 2735.
  // Descobre esses status IDs a partir da configuração live do board — é
  // a fonte de verdade, mais confiável do que IDs fixos (o Jira reusa o
  // mesmo status ID para colunas diferentes em boards diferentes).
  const colunaPorStatusId = buildColunaPorStatusId(board2735Config)
  const backlogStatusIds = new Set<string>()
  for (const [statusId, colNome] of colunaPorStatusId) {
    if (colNome.includes('BACKLOG') || colNome.includes('REFINAMENTO')) {
      backlogStatusIds.add(statusId)
    }
  }
  // Fallback: se o board config não tiver colunas (ex.: dados de amostra),
  // usa os IDs fixos conhecidos do board de Experimentação.
  if (backlogStatusIds.size === 0) {
    backlogStatusIds.add('10004')
    backlogStatusIds.add('10139')
  }

  const backlogEpics = data.allEpics.filter(e => backlogStatusIds.has(e.status.id))
  const backlogCount = backlogEpics.length

  const aguardandoInis = data.iniciativas.filter(i => i.status.id === '13045' || i.status.name === 'Aguardando Piloto')
  const pilotoInis = data.iniciativas.filter(i => i.status.id === '12847' || i.status.name === 'EM PILOTO' || i.status.name === 'Em Piloto')
  const escalaInis = data.iniciativas.filter(i =>
    i.status.id === '12848' || ['EM ESCALA', 'Em Escala', 'Em escala', 'FINALIZADO', 'Finalizado'].includes(i.status.name)
  )

  const emAndamentoEpics = data.allEpics.filter(e => e.status?.id === '3' || e.status?.name === 'Em andamento')
  const emValidacaoEpics = data.allEpics.filter(e => e.status?.id === '10204' || e.status?.name === 'EM VALIDAÇÃO' || e.status?.name === 'Em validação')
  const canceladosEpics = data.allEpics.filter(e => e.status?.id === '10015' || e.status?.name === 'Cancelado' || e.status?.name === 'CANCELADO')
  const concluidosEpics = data.allEpics.filter(e => e.status?.id === '10019')

  const emAndamentoCount = emAndamentoEpics.length + emValidacaoEpics.length
  const canceladosCount = canceladosEpics.length
  const concluidosCount = concluidosEpics.length

  const topMotivosCancelamento = buildTopMotivosCancelamento(canceladosEpics, epicChangelogs)

  // Mapa: key da Iniciativa → timeResponsavel (Lab Responsável)
  // Usado para propagar o lab da iniciativa-pai para os épicos filhos.
  const parentLabLookup = new Map<string, string | null>()
  for (const ini of data.iniciativas) {
    parentLabLookup.set(ini.key, ini.timeResponsavel ?? null)
  }
  const re = (e: EpicDetail) => rowFromEpic(e, parentLabLookup, epicChangelogs)

  const stages: WeeklyStage[] = [
    { id: 'backlog', label: 'Backlog', descricao: 'Experimento aprovado, ainda não iniciado', quantidade: backlogCount, experimentos: backlogEpics.map(re) },
    { id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: emAndamentoCount, experimentos: sortByPrioridadeELab([...emAndamentoEpics, ...emValidacaoEpics].map(re)) },
    { id: 'cancelados', label: 'Cancelados', descricao: 'Experimentos cancelados', quantidade: canceladosCount, motivos: topMotivosCancelamento, experimentos: canceladosEpics.map(re) },
    { id: 'concluidos', label: 'Concluídos', descricao: 'Experimentação encerrada', quantidade: concluidosCount, experimentos: concluidosEpics.map(re) },
    { id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: aguardandoInis.length, experimentos: aguardandoInis.map(rowFromIniciativa) },
    { id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: pilotoInis.length, experimentos: sortByPrioridadeELab(pilotoInis.map(rowFromIniciativa)) },
    { id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: escalaInis.length, experimentos: sortByPrioridadeELab(escalaInis.map(rowFromIniciativa)) },
  ]

  // Experimentos aprovados = total de Epics no board de Experimentação
  // (data.allEpics.length) — MESMA definição de "Total de Experimentos" usada
  // no Funil de Experimentos da aba Estratégia (ver FunilExperimentos.tsx).
  // Não é a soma das fases do funil da pipeline: Backlog/Aguardando/Piloto/
  // Escala são Iniciativas (board de Ideação), um universo diferente, e somá-
  // -las ao total de Epics inflava e duplicava a contagem.
  const experimentosAprovados = data.allEpics.length

  // Ranking de sponsors/diretorias sobre o MESMO universo do total acima —
  // todos os Epics do board de Experimentação.
  const todosEpicsRows = data.allEpics.map(re)
  const topSponsors = buildRanking(todosEpicsRows, 'sponsor')
  const topDiretorias = buildRanking(todosEpicsRows, 'dominio')

  const totalIniciados = emAndamentoCount + concluidosCount
  // Denominador correto agora é Pendente para Análise (ideias cruas do board
  // de Ideação) — Backlog do funil já são experimentos aprovados, não "oportunidades".
  const taxaOportunidadesParaExperimentos = pct(emAndamentoCount, pendenteAnaliseInis.length)

  // Em andamento + Concluídos = a fatia dos experimentos aprovados (slide 1)
  // que já está em execução real ou já terminou — Backlog (não começou) e
  // Cancelados (não seguiu) ficam de fora dessa leitura.
  const emAndamentoMaisConcluidos = emAndamentoCount + concluidosCount

  // Aguardando piloto / Piloto / Em escala nascem DENTRO dos Concluídos — são
  // as iniciativas cujo experimento já terminou e seguiu adiante. O restante
  // dos Concluídos não avançou: virou aprendizado (benchmark, hipótese
  // refutada etc.) sem escalar. Mostrado no funil como um ramo derivado de
  // Concluídos, não como mais uma fase sequencial independente.
  const aprendizadosSemEscalar = Math.max(0, concluidosCount - (aguardandoInis.length + pilotoInis.length + escalaInis.length))

  // Numeradores na mesma lógica da aba Estratégia / Report (ver
  // src/app/report/page.tsx): iniciativas que já chegaram a Piloto/Escala.
  // Denominador: SEMPRE o total de experimentos aprovados do slide 1 (total de
  // Epics), não o total bruto de iniciativas do board de Ideação.
  const countEmPiloto = data.iniciativas.filter(i => data.pilotoStatusIds.includes(i.status.id)).length
  const countEmEscala = data.iniciativas.filter(i => data.escalaStatusIds.includes(i.status.id)).length
  const conversaoPiloto = pct(countEmPiloto + countEmEscala, experimentosAprovados)
  const conversaoEscala = pct(countEmEscala, experimentosAprovados)

  const totalEpics = experimentosAprovados
  const semBeneficioCount = data.allEpics.filter(semBeneficioPotencial).length
  const semSponsorCount = data.allEpics.filter(e => !e.sponsor).length

  // Aprendizados acionáveis: epics concluídos que documentaram um benefício
  // qualitativo (proxy para "gerou aprendizado", já que não há campo dedicado no Jira).
  const aprendizadosAcionaveis = data.allEpics.filter(
    e => ['Concluído', 'FINALIZADO'].includes(e.status.name) && !!e.beneficioQualitativo?.trim()
  ).length

  const { principal, secundario } = buildInsights(conversaoPiloto, conversaoEscala, canceladosCount, topMotivosCancelamento[0], backlogCount)

  const pendenteAnalise: WeeklyStage = {
    id: 'pendente-analise',
    label: 'Pendente para Análise',
    descricao: 'Ideias ainda não avaliadas',
    quantidade: pendenteAnaliseInis.length,
    experimentos: pendenteAnaliseInis.map(rowFromIniciativa),
  }

  return {
    geradoEm: new Date().toISOString(),
    isSample: false,
    governanca: buildGovernancaData(data, board2735Config),
    stages,
    pendenteAnalise,
    beneficioTotal: data.beneficioTotal,
    metasAgregadas: data.metasAgregadas,
    experimentosAprovados,
    emAndamentoMaisConcluidos,
    totalEpics,
    totalIniciados,
    taxaOportunidadesParaExperimentos,
    conversaoPiloto,
    conversaoEscala,
    conversaoPilotoNumerador: countEmPiloto + countEmEscala,
    conversaoEscalaNumerador: countEmEscala,
    conversaoDenominador: experimentosAprovados,
    semBeneficio: { count: semBeneficioCount, pct: pct(semBeneficioCount, totalEpics) },
    semSponsor: { count: semSponsorCount, pct: pct(semSponsorCount, totalEpics) },
    topSponsors,
    topDiretorias,
    experimentosConcluidos: concluidosCount,
    experimentosCancelados: canceladosCount,
    aprendizadosSemEscalar,
    aprendizadosAcionaveis,
    insightPrincipal: principal,
    insightSecundario: secundario,
  }
}

// ── Dados de exemplo (usados quando o Jira está inacessível) ──
const SAMPLE_MOTIVOS_CANCELAMENTO: WeeklyStageMotivo[] = [
  { motivo: 'Falta de Engajamento do BO', count: 7 },
  { motivo: 'Amostra de Dados', count: 4 },
  { motivo: 'Falta de benefício potencial', count: 3 },
]

function sampleRow(i: number, nome: string, fase: string, sponsor: string, dominio: string, beneficio: string): WeeklyExperimentoRow {
  return {
    key: `GL-${1000 + i}`,
    nome,
    objetivo: 'Reduzir custo operacional e melhorar a experiência do cliente com automação.',
    fase,
    statusId: '',
    statusNome: fase,
    sponsor,
    dominio,
    beneficioLabel: beneficio,
    prioridade: null,
    timeResponsavel: null,
    duedate: null,
    motivoBloqueio: null,
  }
}

const SAMPLE_PENDENTE_ANALISE: WeeklyStage = {
  id: 'pendente-analise', label: 'Pendente para Análise', descricao: 'Ideias ainda não avaliadas', quantidade: 82,
  experimentos: [
    sampleRow(11, 'Assistente de Onboarding', 'BACKLOG', 'Carla Tiemi', 'RH', 'Não Mapeado'),
    sampleRow(12, 'Previsão de Demanda de Suporte', 'EM REFINAMENTO', 'Sidney Neves', 'Atendimento', 'R$ 0.9 MM'),
  ],
}

const SAMPLE_STAGES: WeeklyStage[] = [
  {
    id: 'backlog', label: 'Backlog', descricao: 'Experimento aprovado, ainda não iniciado', quantidade: 14,
    experimentos: [
      sampleRow(1, 'Triagem Automática de Chamados', 'BACKLOG', 'Rodrigo Assad', 'Atendimento', 'R$ 1.2 MM'),
      sampleRow(2, 'Score de Risco de Churn', 'Em refinamento', 'Sidney Neves', 'Comercial', 'Não Mapeado'),
    ],
  },
  {
    id: 'andamento', label: 'Em andamento', descricao: 'Execução da experimentação', quantidade: 56,
    experimentos: [
      sampleRow(3, 'Evolução da Clarinha', 'Em andamento', 'Rodrigo Duclos', 'Digital', 'R$ 3.4 MM'),
      sampleRow(4, 'Roteirização Inteligente', 'Em validação', 'Carla Tiemi', 'Rede', 'R$ 0.8 MM'),
    ],
  },
  {
    id: 'cancelados', label: 'Cancelados', descricao: 'Principais motivos', quantidade: 17, motivos: SAMPLE_MOTIVOS_CANCELAMENTO,
    experimentos: [
      sampleRow(5, 'IA para BD', 'Cancelado', 'Patrícia Mofato', 'Dados', 'Não Mapeado'),
      sampleRow(6, 'Recomendação de Produtos', 'Cancelado', 'Marco Zumba', 'Marketing', 'R$ 0.5 MM'),
    ],
  },
  {
    id: 'concluidos', label: 'Concluídos', descricao: 'Experimentação encerrada', quantidade: 33,
    experimentos: [
      sampleRow(7, 'ARI Jurídico', 'FINALIZADO', 'Rogério Estrela', 'Jurídico', 'R$ 2.1 MM'),
    ],
  },
  {
    id: 'aguardando', label: 'Aguardando piloto', descricao: 'Concluído, em avaliação', quantidade: 28,
    experimentos: [
      sampleRow(8, 'Automação de Editais', 'Aguardando Piloto', 'Sidney Neves', 'Compras', 'R$ 1.6 MM'),
    ],
  },
  {
    id: 'piloto', label: 'Piloto', descricao: 'Validação em ambiente real', quantidade: 18,
    experimentos: [
      sampleRow(9, 'Zelador', 'EM PILOTO', 'Rodrigo Assad', 'Operações Técnicas', 'R$ 2.8 MM'),
    ],
  },
  {
    id: 'escala', label: 'Em escala', descricao: 'Solução em implementação', quantidade: 11,
    experimentos: [
      sampleRow(10, 'Identificação de Chamadas de Spam', 'EM ESCALA', 'Marco Zumba', 'Segurança', 'R$ 4.5 MM'),
    ],
  },
]
const SAMPLE_TOTAL_EPICS = 199
const SAMPLE_EXPERIMENTOS_APROVADOS = SAMPLE_TOTAL_EPICS   // mesma definição: total de Epics
const SAMPLE_EM_ANDAMENTO_MAIS_CONCLUIDOS = 56 + 33   // Em andamento + Concluídos
const SAMPLE_TOTAL_INICIADOS = 89
const SAMPLE_TAXA_OPORTUNIDADES = pct(56, SAMPLE_PENDENTE_ANALISE.quantidade)
// Denominador das conversões é SEMPRE o total de experimentos aprovados (slide 1).
const SAMPLE_CONVERSAO_DENOMINADOR = SAMPLE_EXPERIMENTOS_APROVADOS
const SAMPLE_CONVERSAO_ESCALA_NUMERADOR = 24
const SAMPLE_CONVERSAO_PILOTO_NUMERADOR = 59
const SAMPLE_CONVERSAO_PILOTO = pct(SAMPLE_CONVERSAO_PILOTO_NUMERADOR, SAMPLE_CONVERSAO_DENOMINADOR)
const SAMPLE_CONVERSAO_ESCALA = pct(SAMPLE_CONVERSAO_ESCALA_NUMERADOR, SAMPLE_CONVERSAO_DENOMINADOR)
const SAMPLE_APRENDIZADOS = 24   // deve ser <= quantidade de Concluídos (33) — é um subconjunto
const SAMPLE_APRENDIZADOS_SEM_ESCALAR = 10   // Concluídos (33) - (Aguardando 28 + Piloto 18 + Escala 11), ilustrativo
const SAMPLE_TOP_SPONSORS: WeeklyRanking[] = [
  { nome: 'Rodrigo Assad', count: 34 },
  { nome: 'Sidney Neves', count: 28 },
  { nome: 'Rodrigo Duclos', count: 22 },
  { nome: 'Marco Zumba', count: 19 },
  { nome: 'Carla Tiemi', count: 15 },
  { nome: 'Patrícia Mofato', count: 11 },
]
const SAMPLE_TOP_DIRETORIAS: WeeklyRanking[] = [
  { nome: 'Atendimento', count: 41 },
  { nome: 'Comercial', count: 33 },
  { nome: 'Tecnologia', count: 27 },
  { nome: 'Operações Técnicas', count: 21 },
  { nome: 'Dados', count: 18 },
  { nome: 'Jurídico', count: 12 },
]
const SAMPLE_CANCELADOS_COUNT = 17
const SAMPLE_BACKLOG_COUNT = 14
const SAMPLE_INSIGHTS = buildInsights(SAMPLE_CONVERSAO_PILOTO, SAMPLE_CONVERSAO_ESCALA, SAMPLE_CANCELADOS_COUNT, SAMPLE_MOTIVOS_CANCELAMENTO[0], SAMPLE_BACKLOG_COUNT)

export const SAMPLE_WEEKLY_DATA: WeeklyData = {
  geradoEm: new Date().toISOString(),
  isSample: true,
  governanca: SAMPLE_GOVERNANCA_DATA,
  stages: SAMPLE_STAGES,
  pendenteAnalise: SAMPLE_PENDENTE_ANALISE,
  beneficioTotal: 0,
  metasAgregadas: {
    EBITDA: { count: 0, valor: 0 },
    NPS: { count: 0, valor: 0 },
    Receita: { count: 0, valor: 0 },
  },
  experimentosAprovados: SAMPLE_EXPERIMENTOS_APROVADOS,
  emAndamentoMaisConcluidos: SAMPLE_EM_ANDAMENTO_MAIS_CONCLUIDOS,
  totalEpics: SAMPLE_TOTAL_EPICS,
  totalIniciados: SAMPLE_TOTAL_INICIADOS,
  taxaOportunidadesParaExperimentos: SAMPLE_TAXA_OPORTUNIDADES,
  conversaoPiloto: SAMPLE_CONVERSAO_PILOTO,
  conversaoEscala: SAMPLE_CONVERSAO_ESCALA,
  conversaoPilotoNumerador: SAMPLE_CONVERSAO_PILOTO_NUMERADOR,
  conversaoEscalaNumerador: SAMPLE_CONVERSAO_ESCALA_NUMERADOR,
  conversaoDenominador: SAMPLE_CONVERSAO_DENOMINADOR,
  semBeneficio: { count: 36, pct: pct(36, SAMPLE_TOTAL_EPICS) },
  semSponsor: { count: 29, pct: pct(29, SAMPLE_TOTAL_EPICS) },
  topSponsors: SAMPLE_TOP_SPONSORS,
  topDiretorias: SAMPLE_TOP_DIRETORIAS,
  experimentosConcluidos: 42,
  experimentosCancelados: 31,
  aprendizadosSemEscalar: SAMPLE_APRENDIZADOS_SEM_ESCALAR,
  aprendizadosAcionaveis: SAMPLE_APRENDIZADOS,
  insightPrincipal: SAMPLE_INSIGHTS.principal,
  insightSecundario: SAMPLE_INSIGHTS.secundario,
}
