import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  Network,
  Brain,
  ShieldCheck,
  Rocket,
  Users,
} from "lucide-react";

export default function SobreNos() {
  const red = "#7a0019";
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Coluna principal */}
        <main className="space-y-8">
          {/* Hero em faixa com gradiente */}
          <div className="rounded-lg p-8 md:p-10 text-white" style={{ background: `linear-gradient(90deg, ${red}, #b31334)` }}>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">beOn Labs</h1>
            <p className="mt-2 text-lg md:text-xl opacity-95">O laboratório de inovação e experimentação da Claro Brasil</p>
            <p className="mt-4 text-sm md:text-base max-w-3xl opacity-90">
              Conectando diferentes áreas da empresa, cada uma com seu núcleo de P&D, para inovação colaborativa e direcionada.
            </p>
          </div>

          {/* Mosaico: Primeira fileira com 2 cards (Propósito, TRL) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card id="proposito" className="shadow-card">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" color={red} />
                  <CardTitle className="text-xl" style={{ color: red }}>Nosso Propósito</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base md:text-lg text-black/80">
                  Transformar a área de TI em um motor de inovação, reduzindo o tempo entre a ideia e a entrega de valor, com experimentos rápidos, validados e escaláveis. Fortalecer a colaboração entre times multidisciplinares, promovendo uma cultura orientada a dados e aprendizado contínuo.
                </p>
              </CardContent>
            </Card>

            <Card id="trl" className="shadow-card">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" color={red} />
                  <CardTitle className="text-xl" style={{ color: red }}>Technology Readiness Level (TRL)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-base md:text-lg text-black/80">
                <p>O TRL é uma escala internacional que mede o grau de maturidade de uma tecnologia, variando de 1 (conceito básico) até 9 (implementação em operação real).</p>
                <p>No contexto de P&D, o TRL é essencial para monitorar a evolução de experimentos, identificar gargalos e planejar transições mais seguras entre pesquisa, protótipo, piloto e adoção em escala.</p>
              </CardContent>
            </Card>
          </div>

          {/* Segunda fileira com 3 cards: Como Atuamos, Fórum (meio), Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card id="atuacao" className="shadow-card">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5" color={red} />
                  <CardTitle className="text-xl" style={{ color: red }}>Como Atuamos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-black/80 text-base md:text-lg list-disc ml-6 space-y-1.5 md:space-y-2">
                  <li>Pesquisa e análise de tecnologias emergentes</li>
                  <li>Validação técnica de soluções digitais</li>
                  <li>Prototipação e testes em ambiente controlado</li>
                  <li>Redução de custos e riscos por meio de experimentos</li>
                  <li>Colaboração com outros laboratórios do beOn Labs para soluções integradas</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="forum" className="shadow-card">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" color={red} />
                  <CardTitle className="text-xl" style={{ color: red }}>Fórum de Tecnologia</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base md:text-lg text-black/80 mb-2">
                  Acontece a cada 15 dias para apresentar tecnologias desenvolvidas ou testadas na empresa, com participação de líderes de TI, Engenharia, Operações e outros segmentos.
                </p>
                <a href="mailto:daniel.frauches@claro.com.br" className="text-[#7a0019] underline font-semibold">daniel.frauches@claro.com.br</a>
                <span className="block text-black/70 text-base md:text-lg mt-2">
                  Envie uma mensagem para ser adicionado ao invite e fique atualizado do futuro da tecnologia na empresa.
                </span>
              </CardContent>
            </Card>

            <Card id="pilares" className="shadow-card">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5" color={red} />
                  <CardTitle className="text-xl" style={{ color: red }}>Pilares</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-black/80 text-base md:text-lg list-disc ml-6 space-y-1.5 md:space-y-2">
                  <li><b>Future Network</b>: Redes do futuro e conectividade avançada</li>
                  <li><b>AI & ML</b>: Inteligência Artificial e aprendizado de máquina</li>
                  <li><b>Web 3</b>: Ecossistemas descentralizados e seguros</li>
                  <li><b>Desafios Tecnológicos</b>: Abordagem inovadora para problemas complexos</li>
                  <li><b>Áreas envolvidas</b>: TI, HITSS, Digital, Engenharia e BCC</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdos */}
          <Card id="conteudos" className="shadow-card">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-xl" style={{ color: red }}>Conteúdos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-black/80 text-base md:text-lg list-disc ml-6 space-y-1.5">
                <li>Confira o <b>repositório de Pesquisas</b></li>
                <li><b>Fichas de Experimento</b></li>
                <li><b>Relatórios</b></li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="rounded-lg p-6 text-white text-center" style={{ background: `linear-gradient(90deg, ${red}, #b31334)` }}>
            <div className="flex items-center justify-center gap-3">
              <Rocket className="w-6 h-6" />
              <span className="text-2xl font-bold tracking-wide">Sua ideia pode ganhar vida com o beOn Labs!</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
