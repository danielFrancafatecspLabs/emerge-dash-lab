

import { Briefcase, Network, Brain, ShieldCheck, Rocket, Users } from "lucide-react";

export default function SobreNos() {
  return (
    <div className="min-h-screen bg-gray-50 p-0">
      <div className="w-full max-w-7xl mx-auto py-10 px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <section className="md:col-span-2 mb-8">
          <h1 className="text-5xl font-extrabold text-[#7a0019] mb-4 tracking-tight">beOn Labs</h1>
          <p className="text-2xl text-gray-700 font-medium mb-2">O laboratório de inovação e experimentação da Claro Brasil</p>
          <p className="text-lg text-gray-600">Conectando diferentes áreas da empresa, cada uma com seu núcleo de P&D, para inovação colaborativa e direcionada.</p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-[#7a0019] mb-4 flex items-center gap-2"><Briefcase className="w-8 h-8" /> Nosso Propósito</h2>
          <p className="text-lg text-gray-700 mb-6">Transformar a área de TI em um motor de inovação, reduzindo o tempo entre a ideia e a entrega de valor, com experimentos rápidos, validados e escaláveis.</p>
          <h2 className="text-3xl font-bold text-[#7a0019] mb-4 flex items-center gap-2"><Network className="w-8 h-8" /> Pilares</h2>
          <ul className="text-lg text-gray-700 list-disc ml-6 mb-6">
            <li><b>Future Network</b>: Redes do futuro e conectividade avançada</li>
            <li><b>AI & ML</b>: Inteligência Artificial e aprendizado de máquina</li>
            <li><b>Web 3</b>: Ecossistemas descentralizados e seguros</li>
            <li><b>Desafios Tecnológicos</b>: Abordagem inovadora para problemas complexos</li>
            <li><b>Áreas envolvidas</b>: TI, HITSS, Digital, Engenharia e BCC</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-[#7a0019] mb-4 flex items-center gap-2"><Brain className="w-8 h-8" /> Como Atuamos</h2>
          <ul className="text-lg text-gray-700 list-disc ml-6 mb-6">
            <li>Pesquisa e análise de tecnologias emergentes</li>
            <li>Validação técnica de soluções digitais</li>
            <li>Prototipação e testes em ambiente controlado</li>
            <li>Redução de custos e riscos por meio de experimentos</li>
            <li>Colaboração com outros laboratórios do beOn Labs para soluções integradas</li>
          </ul>
          <h2 className="text-3xl font-bold text-[#7a0019] mb-4 flex items-center gap-2"><ShieldCheck className="w-8 h-8" /> Technology Readiness Level (TRL)</h2>
          <p className="text-lg text-gray-700 mb-2">O TRL é uma escala internacional que mede o grau de maturidade de uma tecnologia, variando de 1 (conceito básico) até 9 (implementação em operação real).</p>
          <p className="text-lg text-gray-700 mb-6">No contexto de P&D, o TRL é essencial para monitorar a evolução de experimentos, identificar gargalos e planejar transições mais seguras entre pesquisa, protótipo, piloto e adoção em escala.</p>
        </section>

        <section className="md:col-span-2">
          <h2 className="text-3xl font-bold text-[#7a0019] mb-4 flex items-center gap-2"><Users className="w-8 h-8" /> Fórum de Tecnologia</h2>
          <p className="text-lg text-gray-700 mb-2">Acontece a cada 15 dias para apresentar tecnologias desenvolvidas ou testadas na empresa, com participação de líderes de TI, Engenharia, Operações e outros segmentos.</p>
          <a href="mailto:daniel.frauches@claro.com.br" className="text-[#7a0019] underline font-semibold">daniel.frauches@claro.com.br</a>
          <span className="block text-gray-600 text-base mt-2">Envie uma mensagem para ser adicionado ao invite e fique atualizado do futuro da tecnologia na empresa.</span>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-[#7a0019] mb-4">Conteúdos</h2>
          <ul className="text-lg text-gray-700 list-disc ml-6 mb-6">
            <li>Confira o <b>repositório de Pesquisas</b></li>
            <li><b>Fichas de Experimento</b></li>
            <li><b>Relatórios</b></li>
          </ul>
        </section>

        <section className="md:col-span-2 text-center mt-8">
          <span className="inline-block px-8 py-4 rounded-full bg-[#7a0019] text-white text-2xl font-bold shadow-lg tracking-wide">Sua ideia pode ganhar vida com o beOn Labs!</span>
        </section>
      </div>
    </div>
  );
}
