import {
  BarChart3, ClipboardList, Compass, FlaskConical, Lightbulb, Microscope, PlayCircle, Search, Share2, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { EtapaTrilha } from '@/lib/community/trilha'

// Conteúdo da Trilha de Experimentação. Os vídeos são os episódios da série "Experimentar no beOn Labs".
// O exemplo que atravessa a trilha é o experimento real de Aceitação Remota (Ciclo 1), da Diretoria de
// Implantação e Rede Móvel. Os demais exemplos são ilustrativos e estão marcados como tal.
// Nos textos, **trecho** vira negrito.

export type FaseId = 'comece' | 'planeje' | 'execute'

export const FASES: { id: FaseId; titulo: string; descricao: string }[] = [
  { id: 'comece', titulo: 'Comece aqui', descricao: 'O que o laboratório faz e o que conta como experimento.' },
  { id: 'planeje', titulo: 'Planeje', descricao: 'Do problema à ficha aprovada pelo sponsor.' },
  { id: 'execute', titulo: 'Execute e decida', descricao: 'Do teste à decisão e ao aprendizado registrado.' },
]

export type Bloco =
  | { tipo: 'texto'; titulo?: string; paragrafos: string[] }
  | { tipo: 'cartoes'; titulo?: string; intro?: string; itens: { titulo: string; texto: string }[] }
  | { tipo: 'passos'; titulo?: string; intro?: string; itens: { titulo: string; texto: string }[] }
  | { tipo: 'fluxo'; titulo?: string; intro?: string; itens: { titulo: string; texto: string }[] }
  | { tipo: 'lista'; titulo?: string; intro?: string; itens: string[] }
  | { tipo: 'comparar'; titulo?: string; intro?: string; sim: { titulo: string; itens: string[] }; nao: { titulo: string; itens: string[] } }
  | { tipo: 'tabela'; titulo?: string; intro?: string; colunas: string[]; linhas: string[][]; nota?: string }
  | { tipo: 'nota'; tom: 'dica' | 'atencao'; titulo: string; texto: string }
  | { tipo: 'exemplo'; titulo: string; paragrafos: string[] }
  | { tipo: 'formula'; titulo?: string; intro?: string; partes: { rotulo: string; descricao: string; exemplo: string }[] }

export interface Video {
  src: string
  poster: string
  episodio: string
  titulo: string
  duracao: string
  pontos: string[]
}

export interface Etapa {
  id: EtapaTrilha
  fase: FaseId
  titulo: string
  /** Nome curto, usado no mapa da trilha. */
  curto: string
  resumo: string
  minutos: number
  icon: LucideIcon
  video?: Video
  blocos: Bloco[]
  /** O que aconteceu nesta etapa no experimento de Aceitação Remota. */
  pratica?: string[]
  ferramenta?: { nome: string; descricao: string; modelo: string }
  aprofundar?: { titulo: string; blocos: Bloco[] }
  criterios: string[]
}

export const ETAPAS: Etapa[] = [
  // ── Comece aqui ────────────────────────────────────────────────────────────────────────────
  {
    id: 'boas-vindas', fase: 'comece', icon: Sparkles, minutos: 5,
    titulo: 'Boas-vindas: por que experimentar', curto: 'Boas-vindas',
    resumo: 'O papel do beOn Labs e a lógica que está por trás de cada teste que fazemos.',
    video: {
      src: '/jira/comunidade/videos/boas-vindas.mp4', poster: '/jira/comunidade/videos/boas-vindas.jpg',
      episodio: 'Episódio 1', titulo: 'Por que experimentar?', duracao: '0:52',
      pontos: [
        'Quem é o Ben, cientista do beOn Labs, que acompanha você na série',
        'Por que uma dúvida descoberta tarde demais sai cara',
        'O caminho de todo experimento: ideia, evidência e decisão',
        'Por que errar não é problema, desde que o erro seja barato e ensine algo',
      ],
    },
    blocos: [
      {
        tipo: 'texto', titulo: 'O que o laboratório faz',
        paragrafos: [
          'O beOn Labs é o laboratório de tecnologias emergentes da Claro. O trabalho dele não é construir sistemas prontos nem escolher fornecedores. É responder, com evidência, se uma tecnologia resolve um problema do negócio **antes** que alguém invista pesado nela.',
          'Isso vale para qualquer tecnologia: inteligência artificial, visão computacional, automação de processos, IoT, realidade aumentada, redes privadas, novas interfaces com o cliente. A pergunta é sempre a mesma: isso funciona aqui, para este problema, com estes dados e com estas pessoas?',
        ],
      },
      {
        tipo: 'fluxo', titulo: 'Como experimentamos',
        itens: [
          { titulo: 'Ideia', texto: 'Alguém traz um problema e uma aposta de solução. Por enquanto, é opinião.' },
          { titulo: 'Evidência', texto: 'Um teste pequeno, com meta combinada antes, mostra se a aposta se sustenta.' },
          { titulo: 'Decisão', texto: 'Com o resultado na mão, o sponsor decide se segue, ajusta ou para.' },
        ],
      },
      {
        tipo: 'cartoes', titulo: 'O jeito de testar',
        itens: [
          { titulo: 'Pequeno', texto: 'Escopo mínimo para responder à pergunta. Não é preciso construir o produto inteiro para saber se a ideia funciona.' },
          { titulo: 'Rápido', texto: 'Ciclos de poucas semanas. Quanto mais cedo a resposta chega, mais barato é mudar de rumo.' },
          { titulo: 'Com método', texto: 'Hipótese escrita, métrica definida e critério de sucesso acordado antes de começar. Sem isso, o resultado vira interpretação.' },
        ],
      },
      {
        tipo: 'nota', tom: 'dica', titulo: 'Errar faz parte',
        texto: 'Uma hipótese refutada não é um experimento fracassado. Fracasso é gastar meses e um orçamento grande para descobrir a mesma coisa. Se o erro foi barato e ensinou algo, o experimento cumpriu seu papel.',
      },
      {
        tipo: 'lista', titulo: 'Como usar esta trilha',
        itens: [
          'São dez etapas, em três fases: **Comece aqui**, **Planeje** e **Execute e decida**. Siga na ordem na primeira vez; depois, use como consulta.',
          'Cada etapa traz a explicação, o que aconteceu num experimento real do laboratório, um modelo para copiar e os critérios para seguir em frente.',
          'Tudo está nesta página. Os termos técnicos estão no **Glossário**, no topo.',
          'Marque a etapa como concluída quando terminar. O progresso fica salvo no seu perfil.',
        ],
      },
    ],
    pratica: [
      'Ao longo da trilha você vai acompanhar um experimento real do laboratório: a **Aceitação Remota (Ciclo 1)**, feito com a Diretoria de Implantação e Rede Móvel.',
      'O ponto de partida: engenheiros validavam instalações uma a uma, em três etapas manuais, o que consumia cerca de 500 horas técnicas por mês. A aposta era usar visão computacional para reconhecer, nas fotos, se a instalação estava correta.',
    ],
    criterios: [
      'Sei o que o beOn Labs faz e o que não faz',
      'Entendi o caminho ideia, evidência e decisão',
      'Sei por que um erro barato é aceitável',
    ],
  },
  {
    id: 'e-um-experimento', fase: 'comece', icon: FlaskConical, minutos: 12,
    titulo: 'É um experimento?', curto: 'É um experimento?',
    resumo: 'As quatro condições que separam um experimento de um projeto, de uma entrega ou de uma curiosidade.',
    video: {
      src: '/jira/comunidade/videos/e-um-experimento.mp4', poster: '/jira/comunidade/videos/e-um-experimento.jpg',
      episodio: 'Episódio 2', titulo: 'É um experimento?', duracao: '4:26',
      pontos: [
        'As quatro condições que todo experimento precisa cumprir',
        'Como diferenciar um problema de uma ideia',
        'O exemplo completo: IA no atendimento do chat',
        'Três trabalhos válidos que costumam ser confundidos com experimento',
        'A triagem do laboratório, antes de abrir a ficha',
      ],
    },
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'Chamar de experimento algo que não é custa caro de dois jeitos. Ou a equipe passa semanas testando o que não precisava de teste, ou deixa de testar o que deveria e investe pesado numa solução que não funciona. Por isso, antes de abrir qualquer ficha, a ideia passa por quatro condições. Precisa cumprir todas.',
        ],
      },
      {
        tipo: 'passos', titulo: 'As quatro condições',
        itens: [
          { titulo: 'Problema real e relevante', texto: '**Real**: acontece hoje e dá para mostrar, com dados, reclamações de clientes ou números da operação. **Relevante**: pesa de verdade no cliente, no custo, na receita ou no dia a dia de quem trabalha. Para checar, responda: quem sofre com isso, com que frequência e quanto custa?' },
          { titulo: 'Sem solução pronta', texto: 'Antes de experimentar, pesquise. Já existe algo no mercado que resolve? Outra área da Claro já resolveu? O próprio laboratório já tem algo no catálogo? Se a solução existe e funciona, não é caso de experimento: é de implementar. O experimento entra quando ainda não sabemos se a solução funciona aqui.' },
          { titulo: 'Benefício claro', texto: 'Qual é o ganho, e como medir? Menos tempo, menor custo, mais vendas, clientes mais satisfeitos, menos risco. Sem uma régua, no final ninguém consegue decidir nada.' },
          { titulo: 'Hipótese testável no laboratório', texto: 'A hipótese é uma frase que pode dar certo ou errado. Se não existe chance de dar errado, não há nada para testar. E ela precisa caber no laboratório: dá para testar em poucas semanas, com as tecnologias que o lab já tem, sem construir um sistema inteiro.' },
        ],
      },
      {
        tipo: 'comparar', titulo: 'Problema ou ideia?',
        intro: 'A primeira condição é a que mais derruba propostas. Repare na diferença (exemplos ilustrativos):',
        sim: {
          titulo: 'É problema',
          itens: [
            'Clientes esperam muito tempo no chat de atendimento.',
            'Técnicos voltam ao mesmo endereço porque o defeito não foi resolvido na primeira visita.',
            'O inventário de equipamentos em campo leva semanas e termina com divergências.',
          ],
        },
        nao: {
          titulo: 'É ideia (ainda sem problema)',
          itens: [
            '“Seria legal ter um avatar 3D no app.”',
            '“Precisamos usar realidade aumentada em algum lugar.”',
            '“Vamos ver o que a nova versão daquela plataforma faz.”',
          ],
        },
      },
      {
        tipo: 'passos', titulo: 'O exemplo do vídeo: IA no atendimento do chat',
        intro: 'Juntando as quatro condições numa mesma proposta:',
        itens: [
          { titulo: 'Problema real e relevante', texto: 'Clientes esperando muito no chat. Acontece todo dia e afeta o cliente.' },
          { titulo: 'Sem solução pronta', texto: 'Ainda não sabemos se IA resolve isso aqui, com os nossos atendentes e sistemas.' },
          { titulo: 'Benefício claro', texto: 'Atendimento mais rápido, com o tempo medido.' },
          { titulo: 'Hipótese testável', texto: '“Sugestões de resposta geradas por IA para os atendentes vão reduzir o tempo médio de atendimento”, testada por algumas semanas. Pode dar errado? Sim. Então dá para testar.' },
        ],
      },
      {
        tipo: 'tabela', titulo: 'Válidos, mas não são experimento',
        intro: 'Três tipos de trabalho costumam chegar ao laboratório com o nome de experimento. Todos são legítimos; só seguem outro caminho.',
        colunas: ['Tipo de trabalho', 'Exemplo', 'Por que não é experimento'],
        linhas: [
          ['Projeto', '“Vamos colocar IA em todos os canais de atendimento.”', 'A solução foi escolhida antes de existir uma pergunta.'],
          ['Entrega operacional', '“Vamos criar um dashboard de indicadores.”', 'É importante, mas não responde a nenhuma dúvida. Não há nada sendo testado.'],
          ['Estudo exploratório', '“Vamos testar essa ferramenta nova para ver o que ela faz.”', 'Não há um problema por trás, então não há hipótese.'],
        ],
      },
      {
        tipo: 'tabela', titulo: 'Experimento, prova de conceito, MVP e piloto',
        intro: 'Quatro termos que aparecem juntos e respondem a perguntas diferentes:',
        colunas: ['Termo', 'Pergunta que responde', 'O que entrega'],
        linhas: [
          ['Experimento', 'Isso resolve o problema, com o ganho esperado?', 'Evidência para decidir, contra uma meta combinada antes.'],
          ['Prova de conceito (PoC)', 'É tecnicamente possível?', 'A confirmação de que a tecnologia faz a tarefa, sem medir ganho de negócio.'],
          ['MVP', 'As pessoas usam e veem valor?', 'A menor versão de um produto, nas mãos de usuários reais.'],
          ['Piloto', 'Funciona na operação real?', 'A solução já validada rodando em ambiente real, com escopo limitado, antes de escalar.'],
        ],
      },
      {
        tipo: 'nota', tom: 'dica', titulo: 'A triagem do laboratório',
        texto: 'Para não ficar no achismo, o lab confere essas quatro condições antes de você abrir a ficha do experimento. Passou nas quatro? Siga para a próxima fase da trilha. Ficou em dúvida em alguma? Converse com a Governança do laboratório antes de seguir.',
      },
    ],
    ferramenta: {
      nome: 'Triagem rápida', descricao: 'Responda antes de procurar o laboratório. Se alguma resposta ficar vazia, é ali que está o trabalho.',
      modelo: '1. Problema real e relevante\nQual é o problema, sem citar tecnologia:\nQuem sofre, com que frequência e quanto custa:\n\n2. Sem solução pronta\nO que encontrei no mercado:\nO que encontrei em outras áreas da Claro e no catálogo do lab:\n\n3. Benefício claro\nGanho esperado:\nComo vou medir:\n\n4. Hipótese testável no lab\nHipótese em uma frase:\nCabe em poucas semanas, com as tecnologias do lab? (sim/não)',
    },
    criterios: [
      'Minha ideia cumpre as quatro condições',
      'Pesquisei se já existe solução pronta, fora e dentro da Claro',
      'Sei diferenciar experimento de projeto, entrega operacional e estudo exploratório',
    ],
  },

  // ── Planeje ────────────────────────────────────────────────────────────────────────────────
  {
    id: 'problema', fase: 'planeje', icon: Search, minutos: 8,
    titulo: 'Entender o problema', curto: 'Problema',
    resumo: 'Antes de pensar em tecnologia, descreva a dor com evidência e tamanho.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'Problema é a distância entre como as coisas estão e como deveriam estar, com evidência de que essa distância existe. Parece óbvio, mas muita ideia chega ao laboratório pelo caminho inverso: alguém viu uma tecnologia interessante e procura onde aplicá-la. O risco é sair com uma solução à procura de um problema.',
          'Uma boa descrição de problema não menciona tecnologia. “Usar visão computacional nas vistorias” é uma solução. “As vistorias de instalação levam dias e dependem de conferência manual” é um problema.',
        ],
      },
      {
        tipo: 'cartoes', titulo: 'Onde buscar evidência',
        itens: [
          { titulo: 'Números da operação', texto: 'Volume, tempo de ciclo, retrabalho, custo por atendimento, indisponibilidade. Quando existem, são a evidência mais forte.' },
          { titulo: 'Voz do cliente', texto: 'Reclamações, NPS, avaliações nas lojas de aplicativos, contatos repetidos sobre o mesmo assunto.' },
          { titulo: 'Quem faz o trabalho', texto: 'Converse com quem executa a tarefa todo dia e, se puder, observe acontecendo. O relato costuma esconder os atalhos e os improvisos.' },
          { titulo: 'Referências externas', texto: 'Como o mercado e outras operadoras lidam com o mesmo problema, e que resultados divulgam.' },
        ],
      },
      {
        tipo: 'exemplo', titulo: 'Chegue à causa perguntando “por quê?”',
        paragrafos: [
          'Os clientes reclamam da demora na instalação. **Por quê?** Porque o técnico precisa voltar mais de uma vez. **Por quê?** Porque falta material na primeira visita. **Por quê?** Porque a ordem de serviço não informa o tipo de equipamento do local.',
          'Na terceira pergunta apareceu algo que dá para atacar. Repetir o “por quê?” até umas cinco vezes costuma ser suficiente para sair do sintoma e chegar à causa.',
        ],
      },
      {
        tipo: 'lista', titulo: 'Dimensione a oportunidade',
        intro: 'O tamanho do problema define quanto vale a pena investir para resolvê-lo. Responda:',
        itens: [
          'Quem é impactado, e quantos são.',
          'Com que frequência o problema acontece.',
          'Quanto custa hoje: em horas, em reais, em clientes perdidos ou em risco.',
          'O que acontece se nada for feito.',
        ],
      },
      {
        tipo: 'comparar', titulo: 'Bem escrito ou mal escrito?',
        sim: {
          titulo: 'Bem escrito',
          itens: [
            '“A validação de instalações consome cerca de 500 horas técnicas por mês, em três etapas manuais.” (Aceitação Remota)',
            '“Parte dos chamados técnicos só é resolvida na segunda visita, e cada retorno custa um novo deslocamento.” (ilustrativo; o próximo passo é medir quantos)',
          ],
        },
        nao: {
          titulo: 'Mal escrito',
          itens: [
            '“Precisamos inovar no atendimento.” Vago, sem métrica.',
            '“Queremos usar IA generativa.” É uma solução, não um problema.',
            '“Os clientes não gostam do app.” Sem evidência e sem recorte.',
          ],
        },
      },
      {
        tipo: 'nota', tom: 'atencao', titulo: 'Sem sponsor, não há experimento',
        texto: 'Todo problema precisa de alguém na área de negócio que se importe com a resposta. O **sponsor** patrocina e decide no final. O **ponto focal** conhece o dia a dia, ajuda com dados e abre portas. Sem os dois, o resultado não tem para onde ir.',
      },
    ],
    pratica: [
      'Os engenheiros validavam as instalações uma a uma, em três etapas manuais, o que consumia cerca de 500 horas técnicas por mês.',
      'O problema tinha dono (a Diretoria de Implantação e Rede Móvel), evidência (as horas gastas) e um tamanho conhecido. Tudo isso antes de qualquer conversa sobre modelo ou ferramenta.',
    ],
    ferramenta: {
      nome: 'Canvas do problema', descricao: 'Uma página. Se não couber, o problema ainda está grande ou difuso demais.',
      modelo: 'Problema (em uma frase, sem citar tecnologia):\nQuem é impactado:\nEvidência (dados que mostram que ele existe):\nCausa provável (depois dos “por quês”):\nTamanho da oportunidade (R$, horas, clientes, risco):\nO que acontece se nada for feito:\nSponsor:\nPonto focal:',
    },
    criterios: [
      'O problema cabe em uma frase e não cita tecnologia',
      'Há dados que mostram que ele existe',
      'Sei quem é impactado e quanto custa',
      'Há um sponsor e um ponto focal na área',
    ],
  },
  {
    id: 'hipotese', fase: 'planeje', icon: Lightbulb, minutos: 8,
    titulo: 'Escrever a hipótese', curto: 'Hipótese',
    resumo: 'Transforme a aposta em uma frase que o teste possa confirmar ou derrubar.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'A hipótese é a sua aposta escrita de um jeito que possa ser provada errada. Ela também mantém o experimento honesto: fica registrada antes do início, e o resultado é comparado com ela, não com o que parecer bom no final.',
        ],
      },
      {
        tipo: 'formula', titulo: 'A fórmula SE, ENTÃO, PORQUE',
        intro: 'Três partes, cada uma com um papel. O exemplo é ilustrativo.',
        partes: [
          { rotulo: 'SE', descricao: 'A ação ou a mudança que você vai fazer.', exemplo: 'Se os técnicos de campo receberem instruções em realidade aumentada durante a instalação,' },
          { rotulo: 'ENTÃO', descricao: 'O resultado esperado, com métrica e meta.', exemplo: 'então os retornos ao mesmo endereço vão cair pelo menos 20% em seis semanas,' },
          { rotulo: 'PORQUE', descricao: 'A lógica que sustenta a aposta.', exemplo: 'porque a maioria dos retornos vem de erros de configuração que a instrução visual evita.' },
        ],
      },
      {
        tipo: 'texto', titulo: 'O formato usado na ficha',
        paragrafos: [
          'Na ficha do experimento, a mesma ideia costuma ser escrita assim: “Acreditamos que **[solução]** vai **[resultado mensurável]** para **[público]**, porque **[lógica]**. Saberemos que deu certo quando **[métrica]** atingir **[meta]** em **[prazo]**.” Use o formato que preferir; o conteúdo é o mesmo.',
        ],
      },
      {
        tipo: 'cartoes', titulo: 'O que faz uma hipótese boa',
        itens: [
          { titulo: 'Pode dar errado', texto: 'Se nenhum resultado possível derruba a hipótese, ela não está testando nada.' },
          { titulo: 'Uma variável principal', texto: 'Mude uma coisa por vez. Se o processo, a ferramenta e a equipe mudam juntos, não dá para saber o que causou o resultado.' },
          { titulo: 'Métrica e meta', texto: 'Número e prazo definidos antes do teste, não depois de ver os dados.' },
          { titulo: 'Cabe em um ciclo', texto: 'Responde em poucas semanas. Se não cabe, divida em hipóteses menores.' },
          { titulo: 'Lógica explícita', texto: 'O “porque” mostra o que você acredita sobre o problema. Quando a hipótese cai, é ele que você revisa.' },
        ],
      },
      {
        tipo: 'comparar', titulo: 'Fraca ou forte?', intro: 'Exemplos ilustrativos, em áreas diferentes:',
        sim: {
          titulo: 'Forte',
          itens: [
            '“Se o cliente puder remarcar a visita técnica pelo app, as ligações para remarcar vão cair pelo menos 15% em um mês, porque hoje o único canal para isso é o telefone.”',
            '“Se a conferência de documentos de novos contratos for automatizada, o tempo de ativação vai cair de dias para horas, porque a fila de conferência manual é o principal gargalo.”',
          ],
        },
        nao: {
          titulo: 'Fraca',
          itens: [
            '“Os clientes vão gostar do novo app.” Gostar como? Medido de que jeito?',
            '“A automação vai melhorar o processo.” Melhorar quanto? Qual processo?',
            '“Vamos testar sensores IoT na rede.” Não diz o que se espera que aconteça.',
          ],
        },
      },
      {
        tipo: 'texto', titulo: 'Problemas grandes viram ciclos',
        paragrafos: [
          'Quando a pergunta é grande demais para um ciclo, divida. Uma sequência comum: primeiro, a tecnologia consegue fazer a tarefa? Depois, as pessoas usam? Por último, o ganho aparece na operação? Cada ciclo testa uma hipótese e prepara o seguinte. No Jira, cada ciclo vira um experimento próprio, ligado à mesma iniciativa.',
        ],
      },
    ],
    pratica: [
      '“Acreditamos que um modelo de visão computacional vai classificar corretamente as instalações nas fotos, com acurácia de pelo menos 70%.”',
      'A ambição maior, reduzir a validação manual, ficou para os ciclos seguintes. O Ciclo 1 respondeu a uma pergunta só: a tecnologia consegue reconhecer o que precisa?',
    ],
    ferramenta: {
      nome: 'Modelo de hipótese', descricao: 'Escreva nos dois formatos e veja qual fica mais claro para o seu sponsor.',
      modelo: 'SE [ação ou mudança],\nENTÃO [resultado esperado, com métrica e meta],\nPORQUE [lógica que sustenta a aposta].\n\nOu:\nAcreditamos que [solução] vai [resultado mensurável] para [público], porque [lógica].\nSaberemos que deu certo quando [métrica] atingir [meta] em [prazo].',
    },
    criterios: [
      'A hipótese pode ser confirmada ou refutada',
      'Há uma variável principal',
      'Há métrica, meta numérica e prazo',
      'O “porque” está explícito',
    ],
  },
  {
    id: 'estrategia', fase: 'planeje', icon: Compass, minutos: 10,
    titulo: 'Escolher como validar', curto: 'Como validar',
    resumo: 'Defina o formato do teste, contra o que comparar e por onde começar.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'Com a hipótese escrita, a pergunta passa a ser: qual é o teste mais simples que dá uma resposta confiável? Nem todo experimento precisa de código. Às vezes um protótipo navegável responde mais rápido do que um sistema funcionando.',
        ],
      },
      {
        tipo: 'tabela', titulo: 'Formatos de teste',
        colunas: ['Formato', 'Quando usar', 'Exemplo ilustrativo'],
        linhas: [
          ['Prova técnica em bancada', 'A dúvida é se a tecnologia consegue fazer a tarefa.', 'Medir se um modelo reconhece equipamentos em fotos que já existem.'],
          ['Protótipo com usuários', 'A dúvida é se as pessoas entendem e usam.', 'Testar uma nova jornada de autoatendimento com dez clientes.'],
          ['Mágico de Oz', 'Você quer testar a experiência antes de automatizar.', 'Uma pessoa responde nos bastidores, como se fosse o sistema.'],
          ['Teste A/B', 'Há volume para comparar duas versões ao mesmo tempo.', 'Metade da equipe usa a nova ferramenta e metade segue no processo atual.'],
          ['Antes e depois', 'Não dá para dividir em grupos.', 'Medir um processo por quatro semanas antes da mudança e quatro depois.'],
          ['Simulação ou benchmark', 'O teste em campo é caro ou arriscado.', 'Comparar fornecedores com o mesmo conjunto de dados e os mesmos critérios.'],
        ],
      },
      {
        tipo: 'texto', titulo: 'Defina o baseline',
        paragrafos: [
          'Baseline é o ponto de comparação. Sem ele, um resultado de 80% não diz nada: pode ser ótimo ou pior do que já se faz hoje. Os mais comuns são o processo atual, uma pessoa fazendo a mesma tarefa, uma solução de mercado e, no mínimo, o acaso.',
          'Meça o baseline com o mesmo método e a mesma amostra que vai usar no experimento. Comparar números medidos de jeitos diferentes é comparar coisas diferentes.',
        ],
      },
      {
        tipo: 'lista', titulo: 'Comece pelo mais simples',
        itens: [
          'Teste a abordagem mais simples que pode funcionar antes da mais sofisticada.',
          'Se houver alternativas, teste duas ou três lado a lado e descarte rápido as que não andam.',
          'Prefira dados e ambientes que já existem a construir infraestrutura nova.',
          'Escreva o que fica **fora** do escopo. Isso evita que o experimento cresça no meio do caminho.',
        ],
      },
      {
        tipo: 'nota', tom: 'atencao', titulo: 'Dados, segurança e privacidade',
        texto: 'Se o teste usar dados de clientes ou da operação, confirme antes quais dados podem ser usados, onde vão ficar e quem aprova. Dados pessoais seguem a LGPD e as políticas de segurança da informação da empresa. Resolver isso no começo evita que o experimento pare na metade.',
      },
    ],
    pratica: [
      'O formato foi uma prova técnica em bancada, com fotos reais das instalações. A abordagem principal combinou o YOLO, para detectar os elementos na imagem, com o SAM 2.1, para segmentá-los.',
      'Uma alternativa foi testada e descartada cedo: usar um modelo multimodal de linguagem para rotular as imagens. Ele gerou rótulos inventados, com custo e tempo altos. Descartar rápido também é resultado.',
    ],
    ferramenta: {
      nome: 'Plano de validação', descricao: 'Leve este plano para a conversa com o laboratório.',
      modelo: 'Formato do teste:\nBaseline (contra o que comparar) e como será medido:\nAbordagem principal:\nAlternativas a testar:\nDados necessários e quem aprova o uso:\nFora do escopo:',
    },
    aprofundar: {
      titulo: 'Para ir além: como evitar que o desenho engane você',
      blocos: [
        {
          tipo: 'cartoes',
          itens: [
            { titulo: 'Grupo de controle', texto: 'Um grupo que segue como está, medido no mesmo período. É a forma mais simples de separar o efeito da mudança de tudo o mais que aconteceu ao mesmo tempo.' },
            { titulo: 'Sorteio', texto: 'Sorteie quem entra em cada grupo. Escolher “os melhores” para testar a novidade distorce o resultado.' },
            { titulo: 'Grupos equilibrados', texto: 'Se há diferenças conhecidas (regional, turno, tipo de cliente), equilibre os grupos dentro de cada uma delas antes de sortear.' },
            { titulo: 'Revezamento', texto: 'O mesmo grupo usa as duas versões em períodos alternados. Ajuda quando há poucas pessoas, mas o que se aprende num período pode contaminar o outro.' },
            { titulo: 'Combinações', texto: 'Testar duas mudanças combinadas (desenho fatorial) mostra se uma potencializa a outra. Exige bem mais amostra.' },
            { titulo: 'Avaliação cega', texto: 'Quem avalia não sabe qual versão está vendo. Reduz o viés sempre que o julgamento é humano.' },
          ],
        },
      ],
    },
    criterios: [
      'O formato do teste está escolhido',
      'O baseline está definido e será medido do mesmo jeito',
      'Há uma abordagem principal e, se fizer sentido, alternativas',
      'O uso dos dados está autorizado',
    ],
  },
  {
    id: 'metricas', fase: 'planeje', icon: BarChart3, minutos: 12,
    titulo: 'Definir métricas, meta e amostra', curto: 'Métricas e amostra',
    resumo: 'Uma métrica decide. As outras explicam o resultado e protegem a operação.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'A **métrica primária** é o número que decide se a hipótese foi confirmada, e precisa existir uma só. Com três métricas “principais”, sempre aparece uma que melhorou, e a conversa no final vira escolha de argumento.',
        ],
      },
      {
        tipo: 'cartoes', titulo: 'Quatro papéis de métrica',
        intro: 'Exemplos para um teste ilustrativo de ferramenta de apoio no atendimento:',
        itens: [
          { titulo: 'Primária', texto: 'Decide o resultado e está ligada ao benefício. Exemplo: tempo médio de atendimento.' },
          { titulo: 'Secundárias', texto: 'Explicam o que aconteceu. Exemplo: transferências entre atendentes, uso da ferramenta.' },
          { titulo: 'Guardrails', texto: 'O que não pode piorar. Exemplo: satisfação do cliente, taxa de erro.' },
          { titulo: 'Diagnóstico', texto: 'Mostram se o teste está rodando direito. Exemplo: disponibilidade do sistema, casos por dia.' },
        ],
      },
      {
        tipo: 'tabela', titulo: 'Métricas por tipo de ganho',
        colunas: ['Ganho', 'Métricas comuns'],
        linhas: [
          ['Eficiência', 'Tempo de ciclo, horas economizadas, retrabalho, produtividade.'],
          ['Qualidade', 'Taxa de erro, defeitos, concordância com um especialista.'],
          ['Experiência', 'NPS, CSAT, esforço do cliente, reclamações, contatos repetidos.'],
          ['Receita', 'Conversão, ticket médio, churn.'],
          ['Adoção', 'Uso ativo, recorrência, abandono.'],
          ['Risco', 'Incidentes, falhas de segurança, não conformidades.'],
        ],
      },
      {
        tipo: 'texto', titulo: 'Qual erro é pior?',
        paragrafos: [
          'Quando o experimento detecta ou classifica alguma coisa, existem dois erros possíveis. **Falso positivo**: o sistema aponta um problema que não existe. **Falso negativo**: o problema existe e o sistema não vê.',
          'Na detecção de fraude, deixar uma fraude passar costuma custar mais do que revisar um alarme falso. Num filtro de mensagens, bloquear uma mensagem legítima pode ser o erro mais grave. Decida com o sponsor qual erro pesa mais, porque isso define a métrica primária.',
        ],
      },
      {
        tipo: 'tabela', titulo: 'Precisão, recall e F1 sem complicação',
        colunas: ['Métrica', 'O que mede', 'Use quando'],
        linhas: [
          ['Precisão', 'Dos casos que o sistema apontou, quantos estavam certos.', 'O alarme falso custa caro.'],
          ['Recall', 'Dos casos que existiam, quantos o sistema encontrou.', 'Deixar passar custa caro.'],
          ['F1', 'O equilíbrio entre precisão e recall.', 'Os dois erros importam.'],
          ['Acurácia', 'Acertos sobre o total.', 'As classes têm tamanhos parecidos. Se 95% dos casos são “normal”, acertar sempre “normal” dá 95% e não serve para nada.'],
        ],
      },
      {
        tipo: 'texto', titulo: 'Combine a meta antes',
        paragrafos: [
          'A meta vai para a ficha e é acordada com o sponsor antes do início. Ela precisa ser ambiciosa o bastante para justificar o próximo passo e realista para o tamanho do teste. Uma pergunta ajuda: qual é o resultado mínimo que faria o sponsor querer investir na próxima fase?',
        ],
      },
      {
        tipo: 'tabela', titulo: 'Quanto de amostra?',
        colunas: ['Tamanho', 'Serve para'],
        linhas: [
          ['Cerca de 30 casos', 'Um teste rápido de viabilidade. Mostra se vale continuar, mas não prova nada.'],
          ['Cerca de 100 casos', 'Uma avaliação confiável para decisões internas.'],
          ['300 a 400 casos', 'Decisões importantes, como investimento ou mudança de processo.'],
          ['Pelo menos 30 por grupo', 'Quando o resultado será analisado por grupo: regional, tipo de cliente, tipo de equipamento.'],
        ],
        nota: 'São referências práticas, não regras. Quando a diferença esperada é pequena ou os dados variam muito, a amostra precisa ser maior. Em testes A/B que vão embasar investimento, peça ajuda ao laboratório para calcular o tamanho da amostra.',
      },
      {
        tipo: 'nota', tom: 'atencao', titulo: 'Separe os dados de teste',
        texto: 'Se o experimento envolve treinar ou ajustar algo (um modelo, uma regra, um roteiro), reserve desde o início uma parte dos dados que nunca será usada no ajuste. O resultado final é medido nela. Medir com os mesmos dados usados para ajustar dá um número bonito e falso.',
      },
    ],
    pratica: [
      'Métricas: precisão, recall e F1, comparadas com a rotulagem manual. As metas acordadas foram recall acima de 70% e F1 acima de 60%.',
      'Amostra: 500 imagens, divididas em 350 para treino, 75 para validação e 75 para teste. As 75 de teste nunca foram vistas pelo modelo durante o ajuste.',
    ],
    ferramenta: {
      nome: 'Quadro de métricas', descricao: 'Preencha com o sponsor. É este quadro que vai decidir o resultado.',
      modelo: 'Métrica primária (decide o resultado):\nMeta e prazo:\nComo será medida:\nMétricas secundárias:\nGuardrails (não podem piorar):\nMétricas de diagnóstico:\nQual erro é pior, falso positivo ou falso negativo:\nAmostra (tamanho e divisão entre ajuste e teste):',
    },
    aprofundar: {
      titulo: 'Para ir além: quando o resultado depende de avaliação humana',
      blocos: [
        {
          tipo: 'lista',
          intro: 'Qualidade de uma resposta, clareza de uma tela, utilidade de uma recomendação: às vezes a métrica é o julgamento de pessoas. Alguns cuidados:',
          itens: [
            'Escreva um guia de avaliação com exemplos de nota alta e de nota baixa. Sem isso, cada avaliador usa a própria régua.',
            'Use escalas curtas (de 1 a 5, por exemplo) e descreva o que significa cada ponto.',
            'Tenha pelo menos dois avaliadores por item e meça a concordância entre eles (Kappa de Cohen ou alfa de Krippendorff). Concordância baixa indica que o critério não está claro.',
            'Faça a avaliação às cegas: o avaliador não sabe qual versão está vendo.',
            'Embaralhe a ordem dos itens e limite o tempo de cada sessão para evitar cansaço.',
          ],
        },
      ],
    },
    criterios: [
      'Há uma única métrica primária, ligada ao benefício',
      'A meta foi acordada com o sponsor',
      'O baseline será medido do mesmo jeito',
      'A amostra está dimensionada e os dados de teste estão separados',
    ],
  },
  {
    id: 'ficha', fase: 'planeje', icon: ClipboardList, minutos: 8,
    titulo: 'Montar a ficha do experimento', curto: 'Ficha',
    resumo: 'Tudo o que foi decidido até aqui, num documento que o sponsor aprova antes do início.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'A ficha é o contrato do experimento. Registra o problema, a hipótese, como será o teste, o que conta como sucesso e quem participa. Alinha expectativas antes, guia a execução durante e permite que qualquer pessoa entenda o que foi feito depois.',
          'Se você seguiu as etapas anteriores, a ficha já está quase pronta: é juntar o canvas do problema, a hipótese, o plano de validação e o quadro de métricas.',
        ],
      },
      {
        tipo: 'tabela', titulo: 'O que entra na ficha',
        colunas: ['Seção', 'O que responder'],
        linhas: [
          ['Objetivo', 'Que problema o experimento ataca e por que agora.'],
          ['Hipótese', 'A frase da etapa anterior, sem alterações.'],
          ['Metodologia e ambiente', 'Formato do teste, baseline, dados usados e onde o teste vai rodar.'],
          ['Métricas e critério de sucesso', 'Métrica primária, meta, guardrails e amostra.'],
          ['Benefício esperado', 'O ganho se a hipótese for confirmada, em horas, reais ou clientes.'],
          ['Riscos e dependências', 'O que pode atrasar ou invalidar o teste, e de quem você depende.'],
          ['Equipe e cronograma', 'Quem participa, com que papel, e as datas de cada fase.'],
        ],
      },
      {
        tipo: 'cartoes', titulo: 'Quem é quem',
        itens: [
          { titulo: 'Sponsor', texto: 'Patrocina o experimento na área de negócio e toma a decisão no final.' },
          { titulo: 'Business Owner', texto: 'Responde pelo processo ou produto impactado e ajuda a traduzir o resultado em ganho.' },
          { titulo: 'Ponto focal', texto: 'Conhece o dia a dia, consegue os dados e abre portas na área.' },
          { titulo: 'Time do laboratório', texto: 'Desenha, executa e analisa o experimento junto com a área.' },
        ],
      },
      {
        tipo: 'lista', titulo: 'Regras de um bom desenho',
        itens: [
          'O teste roda isolado da operação. Nada afeta clientes ou sistemas produtivos sem autorização explícita.',
          'Os dados são reais e o uso foi aprovado.',
          'Muda uma variável por vez.',
          'Os dados de teste estão separados desde o início.',
          'Há avaliação às cegas quando o julgamento é humano.',
          'O critério de sucesso está escrito e aprovado pelo sponsor antes de começar.',
        ],
      },
      {
        tipo: 'fluxo', titulo: 'Onde a ideia está no Jira',
        intro: 'A ideia nasce como **iniciativa** no quadro de Ideação. Cada experimento que ela gera vira um **épico** no quadro de Experimentação, ligado a ela. O caminho da iniciativa:',
        itens: [
          { titulo: 'Backlog', texto: 'Registrada, aguardando análise.' },
          { titulo: 'Em refinamento', texto: 'Triagem e construção da ficha.' },
          { titulo: 'Pronto para execução', texto: 'Ficha aprovada, aguardando o início.' },
          { titulo: 'Em experimentação', texto: 'O teste está rodando.' },
          { titulo: 'Em piloto', texto: 'A solução validada roda em ambiente real, com escopo limitado.' },
          { titulo: 'Finalizado', texto: 'Resultado registrado e decisão tomada.' },
        ],
      },
    ],
    pratica: [
      'O ambiente foi isolado: treino em GPU local, sem nenhuma integração com sistemas produtivos.',
      'A calibração usou só o conjunto de validação, e a medição final foi feita nas fotos de teste, que o modelo nunca tinha visto. O critério de sucesso estava na ficha antes da primeira rodada.',
    ],
    ferramenta: {
      nome: 'Esqueleto da ficha', descricao: 'Use para montar o rascunho e revisar com o sponsor antes de registrar.',
      modelo: 'Experimento (nome e ciclo):\nIniciativa de origem:\n\nObjetivo:\nHipótese:\nMetodologia e ambiente:\nBaseline:\nMétrica primária e meta:\nGuardrails:\nAmostra:\nBenefício esperado:\nRiscos e dependências:\n\nSponsor:\nBusiness Owner:\nPonto focal:\nTime do laboratório:\nCronograma (início, medição final, decisão):',
    },
    criterios: [
      'A ficha está completa',
      'O ambiente de teste não afeta a operação',
      'O critério de sucesso foi aprovado pelo sponsor',
      'O experimento está registrado no Jira, ligado à iniciativa',
    ],
  },

  // ── Execute e decida ───────────────────────────────────────────────────────────────────────
  {
    id: 'execucao', fase: 'execute', icon: PlayCircle, minutos: 7,
    titulo: 'Executar e acompanhar', curto: 'Execução',
    resumo: 'Ciclo curto, acompanhamento semanal e o critério de sucesso intocado.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'Um ciclo de experimento costuma durar cerca de um mês e meio. É tempo para gerar evidência e curto o bastante para mudar de rumo sem grande prejuízo. O acompanhamento é semanal, com registro do que avançou, do que foi decidido e do que está travando.',
        ],
      },
      {
        tipo: 'passos', titulo: 'Um ciclo típico', intro: 'Uma referência para planejar. Ajuste ao seu caso.',
        itens: [
          { titulo: 'Preparação', texto: 'Acesso a dados e ambientes, alinhamento com o ponto focal e medição do baseline.' },
          { titulo: 'Construção e rodadas de teste', texto: 'O mínimo necessário para testar a hipótese, com ajustes entre uma rodada e outra.' },
          { titulo: 'Medição final', texto: 'Na amostra separada para teste, com a configuração congelada.' },
          { titulo: 'Análise e decisão', texto: 'Relatório, apresentação ao sponsor e decisão sobre o próximo passo.' },
        ],
      },
      {
        tipo: 'lista', titulo: 'O que registrar enquanto acontece',
        intro: 'Registrar na hora custa minutos. Reconstruir depois custa dias e quase sempre perde detalhes.',
        itens: [
          'Decisões tomadas e o motivo de cada uma.',
          'Versões, parâmetros e configurações usadas em cada rodada.',
          'Mudanças nos dados ou no ambiente.',
          'Impedimentos e quem foi acionado para resolver.',
          'Surpresas, inclusive as ruins.',
        ],
      },
      {
        tipo: 'comparar', titulo: 'O que pode e o que não pode mudar no meio',
        sim: {
          titulo: 'Pode, registrando',
          itens: [
            'Corrigir um erro de execução, como um dado mal carregado ou uma configuração errada.',
            'Trocar uma alternativa que claramente não funciona por outra já prevista no plano.',
            'Pedir mais prazo ao sponsor, com justificativa.',
          ],
        },
        nao: {
          titulo: 'Não pode',
          itens: [
            'Mudar a meta ou a métrica primária depois de ver os primeiros números.',
            'Tirar da amostra os casos em que o resultado foi ruim.',
            'Ampliar o escopo sem combinar e registrar.',
          ],
        },
      },
      {
        tipo: 'nota', tom: 'atencao', titulo: 'Quando parar antes do fim',
        texto: 'Pare e converse com o sponsor se houver risco para clientes ou para a operação, se os dados necessários não estiverem disponíveis ou se ficar claro que a hipótese não pode ser testada do jeito que foi desenhada. Parar cedo, com o motivo registrado, também é aprendizado.',
      },
    ],
    pratica: [
      'Três pessoas rotularam as imagens durante cerca de um mês. Sem um especialista da área na rotulagem, os rótulos ficaram inconsistentes.',
      'O problema não foi escondido: virou registro e, depois, aprendizado para o ciclo seguinte.',
    ],
    ferramenta: {
      nome: 'Registro semanal', descricao: 'Cinco linhas por semana. Leva minutos e vira a base do relatório final.',
      modelo: 'Semana:\nO que avançou:\nDecisões tomadas (e por quê):\nImpedimentos e quem pode ajudar:\nPróximos passos:',
    },
    criterios: [
      'Há acompanhamento semanal registrado',
      'Versões e parâmetros estão documentados',
      'Impedimentos foram escalados a tempo',
      'O critério de sucesso não mudou',
    ],
  },
  {
    id: 'analise', fase: 'execute', icon: Microscope, minutos: 10,
    titulo: 'Analisar e decidir', curto: 'Análise e decisão',
    resumo: 'Compare o resultado com a meta e com o baseline, e leve uma recomendação clara.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'Analisar é comparar o que aconteceu com o que foi combinado. Primeiro, a métrica primária contra a meta. Depois, contra o baseline. Em seguida, as secundárias e os guardrails, para entender o porquê e conferir se algo piorou.',
        ],
      },
      {
        tipo: 'cartoes', titulo: 'Quatro desfechos possíveis',
        itens: [
          { titulo: 'Confirmada', texto: 'A meta foi atingida. Recomende o próximo passo: novo ciclo, piloto ou implementação pela área.' },
          { titulo: 'Refutada', texto: 'A meta não foi atingida. Registre por que e o que isso ensina. É dinheiro que deixou de ser gasto na aposta errada.' },
          { titulo: 'Inconclusiva', texto: 'Os dados não permitem afirmar nada. Normalmente falta amostra ou tempo. Avalie se vale estender.' },
          { titulo: 'Efeito inesperado', texto: 'Aconteceu algo que ninguém previu, bom ou ruim. Registre e transforme em uma nova hipótese.' },
        ],
      },
      {
        tipo: 'tabela', titulo: 'Da análise à decisão',
        colunas: ['Decisão', 'Quando'],
        linhas: [
          ['GO', 'O resultado sustenta o próximo passo: novo ciclo, piloto ou implementação.'],
          ['GO com condições', 'Sustenta, desde que algo seja resolvido antes. Escreva a condição e quem cuida dela.'],
          ['Novo ciclo', 'A pergunta continua aberta e precisa de outro teste para ser respondida.'],
          ['NO GO', 'A aposta não se confirmou. Encerre e registre o aprendizado.'],
        ],
      },
      {
        tipo: 'lista', titulo: 'Cuidados na leitura do resultado',
        itens: [
          '**Diferença pequena pode ser acaso.** Com amostras pequenas, variações de poucos pontos percentuais costumam não significar nada.',
          '**Olhe por grupo.** Uma média boa pode esconder um grupo em que o resultado piorou muito.',
          '**Desconfie do que parece bom demais.** Confira se os dados de teste não vazaram para o ajuste.',
          '**Correlação não é causa.** Se algo mais mudou no período (uma campanha, a sazonalidade, um sistema novo), o efeito pode não ser seu.',
          '**Não troque a régua no fim.** Vale a métrica primária combinada, mesmo que outra tenha ficado mais bonita.',
        ],
      },
    ],
    pratica: [
      'Recall de 77,5% (meta acima de 70%), precisão de 72,7% e F1 de 75,1% (meta acima de 60%).',
      'Decisão: hipótese do Ciclo 1 confirmada, com uma condição para seguir: revalidar a rotulagem com os técnicos de campo.',
    ],
    ferramenta: {
      nome: 'Leitura do resultado', descricao: 'Leve preenchido para a reunião de decisão com o sponsor.',
      modelo: 'Métrica | Meta | Baseline | Resultado | Atingiu?\n\nDesfecho (confirmada, refutada, inconclusiva, efeito inesperado):\nO que explica o resultado:\nLimitações do teste:\nRecomendação (GO, GO com condições, novo ciclo, NO GO):\nCondições para avançar e responsáveis:',
    },
    aprofundar: {
      titulo: 'Para ir além: um pouco de estatística',
      blocos: [
        {
          tipo: 'cartoes',
          itens: [
            { titulo: 'Intervalo de confiança', texto: 'Em vez de “acertou 80%”, diga “acertou entre 74% e 85%, com 95% de confiança” (exemplo para 200 casos). O intervalo mostra a incerteza que vem do tamanho da amostra: quanto menor a amostra, mais largo ele fica.' },
            { titulo: 'Valor-p', texto: 'A chance de ver uma diferença igual ou maior se, na verdade, não houvesse efeito nenhum. Abaixo de 0,05 costuma ser considerado significativo. Não diz se a diferença é grande.' },
            { titulo: 'Tamanho do efeito', texto: 'Quanto mudou na prática. Uma diferença estatisticamente significativa pode ser pequena demais para justificar o investimento, e o sponsor decide com base nisso.' },
            { titulo: 'Teste de permutação', texto: 'Embaralha muitas vezes quem estava em cada grupo e verifica com que frequência uma diferença como a sua aparece por acaso. Funciona bem com amostras pequenas.' },
          ],
        },
      ],
    },
    criterios: [
      'O resultado foi comparado com a meta e com o baseline',
      'O critério não mudou no fim',
      'Os guardrails foram conferidos',
      'A decisão foi tomada com o sponsor',
    ],
  },
  {
    id: 'aprendizado', fase: 'execute', icon: Share2, minutos: 6,
    titulo: 'Registrar e compartilhar', curto: 'Aprendizado',
    resumo: 'O que um experimento ensina só vira ativo da empresa quando outras pessoas conseguem encontrar.',
    blocos: [
      {
        tipo: 'texto',
        paragrafos: [
          'Todo experimento termina com um relatório, inclusive quando a hipótese é refutada. Um resultado negativo bem documentado evita que outra área gaste tempo e dinheiro na mesma aposta. Valor de aprendizado conta tanto quanto valor de resultado.',
        ],
      },
      {
        tipo: 'tabela', titulo: 'O relatório de resultados',
        colunas: ['Seção', 'O que contar'],
        linhas: [
          ['Resumo', 'Hipótese, resultado e decisão em um parágrafo, para quem só vai ler isso.'],
          ['Resultados', 'Métricas contra a meta e contra o baseline, com números.'],
          ['Aprendizados', 'O que funcionou, o que não funcionou e o que faria diferente.'],
          ['Limitações', 'O que o teste não permite afirmar.'],
          ['Próximos passos', 'A decisão tomada e quem é responsável por ela.'],
          ['Onde está o material', 'Dados, código e configurações, e como chegar até eles.'],
        ],
      },
      {
        tipo: 'comparar', titulo: 'Aprendizado útil ou genérico?',
        sim: {
          titulo: 'Útil',
          itens: [
            '“Sem um especialista na rotulagem, os rótulos ficaram inconsistentes. No próximo ciclo, os técnicos de campo revisam uma amostra antes do treino.”',
            '“A variedade de gabinetes pesou mais no resultado do que o ajuste do modelo.”',
          ],
        },
        nao: {
          titulo: 'Genérico',
          itens: [
            '“A qualidade dos dados é importante.”',
            '“A comunicação poderia ter sido melhor.”',
          ],
        },
      },
      {
        tipo: 'texto', titulo: 'E depois?',
        paragrafos: [
          'Hipótese confirmada leva a um novo ciclo, a um piloto ou à implementação pela área. Hipótese refutada encerra o experimento ou dá origem a uma nova pergunta. Nos dois casos, a iniciativa e o épico no Jira são atualizados com a decisão.',
          'Compartilhe também aqui na comunidade. O botão **Compartilhar aprendizado**, no fim desta etapa, abre o editor já com o modelo abaixo.',
        ],
      },
    ],
    pratica: [
      'Os aprendizados do Ciclo 1: a qualidade da rotulagem é a principal alavanca; a variedade de gabinetes pesa mais do que o ajuste do modelo; 500 imagens bastam para provar a hipótese, mas não para operar em escala.',
      'Cada um deles virou insumo para desenhar o ciclo seguinte.',
    ],
    ferramenta: {
      nome: 'Post de aprendizado', descricao: 'Este é o texto que vai para o editor da comunidade.',
      modelo: 'Experimento:\nHipótese:\nResultado (métrica × meta):\nDecisão:\nO que funcionou:\nO que não funcionou:\nO que faríamos diferente:\nPróximo passo:',
    },
    criterios: [
      'O relatório foi publicado, mesmo com hipótese refutada',
      'O aprendizado foi compartilhado na comunidade',
      'O próximo ciclo ou o encerramento está definido no Jira',
    ],
  },
]

export const GLOSSARIO: { termo: string; definicao: string }[] = [
  { termo: 'Acurácia', definicao: 'Acertos sobre o total de casos. Engana quando uma classe é muito mais comum que as outras.' },
  { termo: 'Amostra', definicao: 'O conjunto de casos usados para medir o resultado.' },
  { termo: 'Baseline', definicao: 'O ponto de comparação: o processo atual, uma pessoa fazendo a tarefa, uma solução de mercado ou o acaso.' },
  { termo: 'Business Owner', definicao: 'Responsável pelo processo ou produto impactado pelo experimento.' },
  { termo: 'Ciclo', definicao: 'Cada rodada de experimento de uma mesma iniciativa, com sua própria hipótese e resultado.' },
  { termo: 'Entrega operacional', definicao: 'Trabalho importante que não responde a uma dúvida, como um dashboard. Não é experimento.' },
  { termo: 'Estudo exploratório', definicao: 'Conhecer uma tecnologia sem um problema por trás. Não é experimento, porque não há hipótese.' },
  { termo: 'Experimento', definicao: 'Teste pequeno de uma hipótese, com meta combinada antes, para decidir com evidência. No Jira, é um épico do quadro de Experimentação.' },
  { termo: 'F1', definicao: 'Medida que equilibra precisão e recall.' },
  { termo: 'Falso negativo', definicao: 'O problema existe e o sistema não o detecta.' },
  { termo: 'Falso positivo', definicao: 'O sistema aponta um problema que não existe.' },
  { termo: 'Ficha do experimento', definicao: 'Documento com objetivo, hipótese, método, métricas, critério de sucesso, equipe e cronograma, aprovado pelo sponsor.' },
  { termo: 'GO / NO GO', definicao: 'A decisão de seguir ou não para o próximo passo depois do resultado.' },
  { termo: 'Guardrail', definicao: 'Métrica que não pode piorar durante o experimento.' },
  { termo: 'Hipótese', definicao: 'Uma frase que pode dar certo ou errado, com ação, resultado esperado e a lógica que os liga.' },
  { termo: 'Iniciativa', definicao: 'A ideia estratégica que dá origem a um ou mais experimentos. Vive no quadro de Ideação do Jira.' },
  { termo: 'Métrica primária', definicao: 'O único número que decide se a hipótese foi confirmada.' },
  { termo: 'MVP', definicao: 'A menor versão de um produto que entrega valor a usuários reais.' },
  { termo: 'Piloto', definicao: 'Solução já validada rodando em ambiente real, com escopo limitado, antes de escalar.' },
  { termo: 'Ponto focal', definicao: 'Pessoa da área que conhece o dia a dia, consegue os dados e abre portas.' },
  { termo: 'Precisão', definicao: 'Dos casos que o sistema apontou, quantos estavam certos.' },
  { termo: 'Projeto', definicao: 'Trabalho em que a solução já foi escolhida. Não é experimento.' },
  { termo: 'Prova de conceito (PoC)', definicao: 'Teste que mostra se algo é tecnicamente possível, sem medir ganho de negócio.' },
  { termo: 'Recall', definicao: 'Dos casos que existiam, quantos o sistema encontrou.' },
  { termo: 'Sponsor', definicao: 'Quem patrocina o experimento na área de negócio e toma a decisão no final.' },
  { termo: 'Triagem', definicao: 'Conferência das quatro condições de um experimento, antes de abrir a ficha.' },
]
