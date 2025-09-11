import User from "../models/User.js";
// Rota de registro de usuário padrão
import express from "express";
import AuthController from "../controllers/AuthController.js";

const router = express.Router();

router.post("/login", AuthController.login);

// Registro de usuário padrão
router.post("/register", async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res.status(400).json({ error: "Username e password obrigatórios." });
	}
	const exists = await User.findOne({ username });
	if (exists) {
		return res.status(409).json({ error: "Usuário já existe." });
	}
	const user = new User({ username, password, role: "user" });
	await user.save();
	res.status(201).json({ message: "Usuário criado com sucesso." });
});
export default router;
