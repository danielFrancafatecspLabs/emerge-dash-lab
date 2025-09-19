import mongoose from "mongoose";

const ExperimentoSchema = new mongoose.Schema(
  {
    iniciativa: { type: String },
    descricao: { type: String },
    relatorio: { type: String }, // URL do relatório
    ficha: { type: String }, // URL da ficha
    Sinal: { type: String }, // Mapeado do campo '#'
    tamanho: { type: String, enum: ["P", "M", "G"] }, // Tamanho do experimento
    desenvolvedorResp: { type: String }, // Novo campo para responsável
    // ... outros campos dinâmicos
  },
  { strict: false }
);
const Experimento = mongoose.model("Experimento", ExperimentoSchema);

export default Experimento;
