import express from "express";
import ExperimentoController from "../controllers/ExperimentoController.js";

const router = express.Router();

router.get("/", ExperimentoController.listar);
router.post("/", ExperimentoController.criar);
router.put("/:id", ExperimentoController.atualizar);
router.delete("/:id", ExperimentoController.deletar);

export default router;
