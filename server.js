

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./api/routes/auth');
require('dotenv').config();

const app = express();
app.use(express.json());

// Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Atlas conectado')).catch(err => console.error('Erro MongoDB:', err));

// Rotas de autenticação
app.use('/api', authRoutes);

const EXCEL_PATH = path.join(process.cwd(), 'Status_Iniciativas beOn Labs v2.0.xlsx');


// Retorna todos os dados da planilha (Planilha 1)
app.get('/api/dados', (req, res) => {
  try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler ou processar o Excel local.' });
  }
});

// Retorna o total de ideias da coluna 'ideia/problema/oportunidade' da Planilha 1
app.get('/api/total-ideias', (req, res) => {
  try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    // Conta o total de linhas que possuem valor na coluna 'ideia/problema/oportunidade'
    const coluna = Object.keys(data[0] || {}).find(key => key.toLowerCase().includes('ideia'));
    const total = data.filter(row => row[coluna] && String(row[coluna]).trim() !== '').length;
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler ou processar o Excel local.' });
  }
});

app.listen(3001, () => console.log('API rodando em http://localhost:3001'));
