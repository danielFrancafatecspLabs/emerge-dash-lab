import User from "../models/User.js";
import jwt from "jsonwebtoken";

class AuthService {
  static async login({ username, password }) {
    const user = await User.findOne({ username });
    if (!user) throw new Error("Usuário ou senha inválidos");
    const valid = await user.comparePassword(password);
    if (!valid) throw new Error("Usuário ou senha inválidos");
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return { token, user: { username: user.username, role: user.role } };
  }
}

export default AuthService;
