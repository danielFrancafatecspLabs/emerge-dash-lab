import mongoose from "mongoose";

const ExperimentoSchema = new mongoose.Schema(
  {
    iniciativa: { type: String },
    descricao: { type: String },
    relatorio: { type: String }, // URL do relatório
    ficha: { type: String }, // URL da ficha
  },
  { strict: false }
);
const Experimento = mongoose.model("Experimento", ExperimentoSchema);

export default Experimento;
