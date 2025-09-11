import fs from 'fs';
import Papa from 'papaparse';

const csvFile = '/workspaces/emerge-dash-lab/public/planilha1.csv';
const jsonFile = '/workspaces/emerge-dash-lab/experimentos.json';

const csv = fs.readFileSync(csvFile, 'utf8');
const { data } = Papa.parse(csv, { header: true });

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
console.log('Arquivo JSON gerado:', jsonFile);
