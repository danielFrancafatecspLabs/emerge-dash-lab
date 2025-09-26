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
    // Força statusPiloto para URA e Call Center Cognitivo
    if (typeof data.iniciativa === "string") {
      const iniNorm = data.iniciativa.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      // Fallback para nome exato (com ou sem acento, maiúsculas/minúsculas)
      const exatos = [
        "ura e call center cognitivo",
        "ura e callcenter cognitivo",
        "ura & call center cognitivo",
        "copilot atendimento"
      ];
      if (
        exatos.includes(iniNorm.trim()) ||
        (iniNorm.includes("ura") && iniNorm.includes("call center") && iniNorm.includes("cognitivo")) ||
        iniNorm.includes("copilot atendimento") ||
        iniNorm.includes("copiloto atendimento")
      ) {
        data.statusPiloto = "2.5 - ROLL-OUT";
      }
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
    // Força statusPiloto para URA e Call Center Cognitivo
    if (typeof data.iniciativa === "string") {
      const iniNorm = data.iniciativa.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      // Fallback para nome exato (com ou sem acento, maiúsculas/minúsculas)
      const exatos = [
        "ura e call center cognitivo",
        "ura e callcenter cognitivo",
        "ura & call center cognitivo"
      ];
      if (
        exatos.includes(iniNorm.trim()) ||
        (iniNorm.includes("ura") && iniNorm.includes("call center") && iniNorm.includes("cognitivo"))
      ) {
        data.statusPiloto = "2.5 - ROLL-OUT";
      }
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
