import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// String de conexão real do Atlas
mongoose.connect('mongodb+srv://danielfrancatech_db_user:pGmm8Bp0IBeqOUPf@cluster0.kpcvuvm.mongodb.net/dashboard_labs?retryWrites=true&w=majority&appName=Cluster0');

const ExperimentoSchema = new mongoose.Schema({}, { strict: false });
const Experimento = mongoose.model('Experimento', ExperimentoSchema);

// Listar todos
app.get('/experimentos', async (req, res) => {
  const lista = await Experimento.find();
  res.json(lista);
});

// Criar novo
app.post('/experimentos', async (req, res) => {
  const novo = new Experimento(req.body);
  await novo.save();
  res.json(novo);
});

// Atualizar
app.put('/experimentos/:id', async (req, res) => {
  const atualizado = await Experimento.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(atualizado);
});

// Deletar
app.delete('/experimentos/:id', async (req, res) => {
  await Experimento.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Iniciar servidor
app.listen(4000, () => console.log('API rodando em http://localhost:4000'));
