import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import Experimento from "../src/models/Experimento.js";

// Carrega .env do mesmo jeito que o server.js (prioriza backend/.env, senão raiz)
const envPath = fs.existsSync(".env") ? ".env" : "../.env";
dotenv.config({ path: envPath });

// Permite passar a URI via argumento --uri="..."
const uriArg = process.argv.find((a) => a.startsWith("--uri="));
const cliUri = uriArg ? uriArg.split("=")[1] : undefined;
const MONGODB_URI = cliUri || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Migration aborted: MONGODB_URI is not set.");
  console.error(
    'Set it in backend/.env (or project .env), or pass --uri="<connection_string>".'
  );
  console.error("Example (PowerShell):");
  console.error(
    '  $env:MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"; npm run migrate:backfill-owners'
  );
  console.error("Or:");
  console.error(
    '  node ./scripts/backfill_responsavel_relator.js --uri="mongodb+srv://..."'
  );
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const res = await Experimento.updateMany(
      {
        $or: [
          { Responsavel: { $exists: false } },
          { Relator: { $exists: false } },
        ],
      },
      {
        $set: {
          Responsavel: null,
          Relator: null,
        },
      }
    );

    console.log(`Updated ${res.modifiedCount || 0} documents.`);
  } catch (err) {
    console.error("Migration error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
