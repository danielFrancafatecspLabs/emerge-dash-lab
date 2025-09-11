import AuthService from "../services/AuthService.js";

class AuthController {
  static async login(req, res) {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (err) {
      res
        .status(401)
        .json({ error: err.message || "Usuário ou senha inválidos" });
    }
  }
}

export default AuthController;
