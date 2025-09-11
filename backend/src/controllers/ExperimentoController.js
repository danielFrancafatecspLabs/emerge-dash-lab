import ExperimentoService from "../services/ExperimentoService.js";

class ExperimentoController {
  static async listar(req, res) {
    try {
      const lista = await ExperimentoService.listar();
      res.json(lista);
    } catch (err) {
      res.status(500).json({ error: "Erro ao listar experimentos." });
    }
  }

  static async criar(req, res) {
    try {
      const novo = await ExperimentoService.criar(req.body);
      res.json(novo);
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar experimento." });
    }
  }

  static async atualizar(req, res) {
    try {
      const atualizado = await ExperimentoService.atualizar(
        req.params.id,
        req.body
      );
      res.json(atualizado);
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar experimento." });
    }
  }

  static async deletar(req, res) {
    try {
      await ExperimentoService.deletar(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao deletar experimento." });
    }
  }
}

export default ExperimentoController;
