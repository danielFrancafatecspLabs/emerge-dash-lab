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
    const novo = new Experimento(data);
    return novo.save();
  }

  static async atualizar(id, data) {
    return Experimento.findByIdAndUpdate(id, data, { new: true });
  }

  static async deletar(id) {
    return Experimento.findByIdAndDelete(id);
  }
}

export default ExperimentoService;
