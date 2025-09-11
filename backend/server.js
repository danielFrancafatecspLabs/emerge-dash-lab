import express from "express";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.js";
import experimentosRoutes from "./src/routes/experimentos.js";
import fs from "fs";

// Detecta se .env está na pasta backend ou na raiz
const envPath = fs.existsSync(".env") ? ".env" : "../.env";
dotenv.config({ path: envPath });

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://seu-dominio.com",
  "https://www.seu-dominio.com",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: mobile, curl)
      if (!origin) return callback(null, true);
      // Permite todas as origens em desenvolvimento
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Conexão com MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas conectado"))
  .catch((err) => console.error("Erro MongoDB:", err));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/experimentos", experimentosRoutes);

const EXCEL_PATH = path.join(
  process.cwd(),
  "Status_Iniciativas beOn Labs v2.0.xlsx"
);

// Retorna todos os dados da planilha (Planilha 1)
// ...existing code...
app.get("/api/total-ideias", (req, res) => {
  try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    // Conta o total de linhas que possuem valor na coluna 'ideia/problema/oportunidade'
    const coluna = Object.keys(data[0] || {}).find((key) =>
      key.toLowerCase().includes("ideia")
    );
    const total = data.filter(
      (row) => row[coluna] && String(row[coluna]).trim() !== ""
    ).length;
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler ou processar o Excel local." });
  }
});

app.listen(3001, () => console.log("API rodando em http://localhost:3001"));
