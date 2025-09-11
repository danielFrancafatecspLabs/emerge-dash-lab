import Experimento from "../models/Experimento.js";

class ExperimentoService {
  static async listar() {
    return Experimento.find();
  }

  static async criar(data) {
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
