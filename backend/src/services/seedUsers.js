import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

async function createAdminUser() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const exists = await User.findOne({ username: "daniel" });
  if (exists) {
    console.log("Usuário 'daniel' já existe.");
    process.exit(0);
  }

  const user = new User({
    username: "daniel",
    password: "daniel123",
    role: "admin",
  });
  await user.save();
  console.log("Usuário 'daniel' criado com sucesso!");
  process.exit(0);
}

createAdminUser();
