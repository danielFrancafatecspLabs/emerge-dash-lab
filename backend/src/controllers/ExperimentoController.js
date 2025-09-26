import ExperimentoService from "../services/ExperimentoService.js";
import mongoose from "mongoose";

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

      
      // Validar se o ID é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.error("ID inválido:", req.params.id);
        return res.status(400).json({ error: "ID do experimento inválido" });
      }
      
      const atualizado = await ExperimentoService.atualizar(
        req.params.id,
        req.body
      );
      
      if (!atualizado) {
        return res.status(404).json({ error: "Experimento não encontrado" });
      }
      
      res.json(atualizado);
    } catch (err) {
      console.error("=== ERRO AO ATUALIZAR ===");
      console.error("Erro:", err.message);
      console.error("Stack:", err.stack);
      res.status(500).json({ error: "Erro ao atualizar experimento.", details: err.message });
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
