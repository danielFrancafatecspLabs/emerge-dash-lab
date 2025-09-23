import Experimento from "../models/Experimento.js";

class ExperimentoService {
  static async listar() {
    const lista = await Experimento.find();
    return lista.map((exp) => {
      if (!exp.Sinal && exp["#"]) {
        exp.Sinal = exp["#"];
      }
      return exp;
    });
  }

  static async criar(data) {
    // Mapeia o campo '#' para 'Sinal' se existir
    if (data["#"]) {
      data.Sinal = data["#"];
    }
    // Aceita campo tamanho (P, M, G)
    if (data.tamanho && ["P", "M", "G"].includes(data.tamanho)) {
      data.tamanho = data.tamanho;
    }
    // Aceita campo desenvolvedorResp
    if (data.desenvolvedorResp && typeof data.desenvolvedorResp === "string") {
      data.desenvolvedorResp = data.desenvolvedorResp;
    }
    // Aceita campo statusPiloto
    if (typeof data.statusPiloto === "string") {
      data.statusPiloto = data.statusPiloto;
    }
    const novo = new Experimento(data);
    return novo.save();
  }

  static async atualizar(id, data) {
    // Aceita campo tamanho (P, M, G)
    if (data.tamanho && ["P", "M", "G"].includes(data.tamanho)) {
      data.tamanho = data.tamanho;
    }
    // Aceita campo desenvolvedorResp
    if (data.desenvolvedorResp && typeof data.desenvolvedorResp === "string") {
      data.desenvolvedorResp = data.desenvolvedorResp;
    }
    // Aceita campo statusPiloto
    if (typeof data.statusPiloto === "string") {
      data.statusPiloto = data.statusPiloto;
    }
    return Experimento.findByIdAndUpdate(id, data, { new: true });
  }

  static async deletar(id) {
    return Experimento.findByIdAndDelete(id);
  }
}

export default ExperimentoService;
