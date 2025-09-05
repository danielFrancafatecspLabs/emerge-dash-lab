
import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import * as SelectPrimitive from '@radix-ui/react-select';
import Papa from 'papaparse';

type Experimento = { [key: string]: string };

const STATUS_COLUMNS = [
  'Ideia / Problema / Oportunidade',
  'Experimentação',
  'Piloto',
  'Escala'
];

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'Em andamento', label: 'Em andamento' },
  { value: 'Concluído', label: 'Concluído' },
  { value: 'Pendente', label: 'Pendente' },
];

const STATUS_LEGEND = [
  { color: '#22c55e', label: 'Dentro do prazo' },
  { color: '#eab308', label: 'Ponto de atenção' },
  { color: '#ef4444', label: 'Fora do prazo, bloqueado' },
];

function BlinkingDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full animate-pulse"
      style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}` }}
    />
  );
}

function StatusLegend() {
  return (
    <div className="flex gap-6 items-center mb-4">
      {STATUS_LEGEND.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <BlinkingDot color={item.color} />
          <span className="text-gray-700 text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function EditCard({ columns, editData, onChange, onCancel, onSave }: {
  columns: string[];
  editData: Experimento;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl flex flex-col">
        <h2 className="text-xl font-bold mb-4">Editar Experimento</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {columns.map((col) => (
            <div key={col} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">{col}</label>
              {STATUS_COLUMNS.includes(col) ? (
                <select
                  className="border rounded px-2 py-1 text-gray-800"
                  value={editData[col] || ''}
                  onChange={(e) => onChange(col, e.target.value)}
                  disabled={col === '#'}
                >
                  <option value="">Selecione...</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              ) : (
                <input
                  className="border rounded px-2 py-1 text-gray-800"
                  value={col.toLowerCase().includes('previsão de término') && editData[col] ? editData[col].split(' ')[0] : editData[col] || ''}
                  onChange={(e) => onChange(col, e.target.value)}
                  disabled={col === '#'}
                  type={col.toLowerCase().includes('previsão de término') ? 'date' : 'text'}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 rounded bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function ListaDeExperimentos() {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const toggleColumn = (col: string) => {
    setHiddenColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };
  const [data, setData] = useState<Experimento[]>([]);
  const [filtered, setFiltered] = useState<Experimento[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<Experimento | null>(null);
  // Valores únicos da coluna 'Experimentação' para filtros
  const experimentacaoValues = Array.from(new Set(data.map(row => row['Experimentação']).filter(Boolean)));

  useEffect(() => {
    fetch('/planilha1.csv')
      .then((res) => res.text())
      .then((csv) => {
        const result = Papa.parse(csv, { header: true });
        setData(result.data as Experimento[]);
        setFiltered(result.data as Experimento[]);
      });
  }, []);

  // Detecta a coluna de status automaticamente
  const statusColumn = data.length > 0
    ? Object.keys(data[0]).find(
        (col) => col.toLowerCase().includes('situação') || col.toLowerCase().includes('status')
      )
    : undefined;

  useEffect(() => {
    let temp = data;
    // Filtro pela coluna 'Experimentação' usando botões
    if (status) {
      temp = temp.filter((item) => item['Experimentação'] === status);
    }
    if (search) temp = temp.filter((item) =>
      Object.values(item).some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );
    setFiltered(temp);
  }, [search, status, data, statusColumn]);

  const columns = data.length > 0
  ? Object.keys(data[0])
    .filter((col) => !col.toLowerCase().includes('unnamed'))
    .filter((col) => !col.toLowerCase().includes('datas perdidas'))
    .filter((col) => !hiddenColumns.includes(col))
  : [];
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({ ...filtered[idx] });
  };

  const handleEditChange = (key: string, value: string) => {
    if (editData) setEditData({ ...editData, [key]: value });
  };

  const handleEditSave = () => {
    if (editIdx !== null && editData) {
      const updated = [...data];
      const originalIdx = data.findIndex((item) => item['#'] === filtered[editIdx]['#']);
      if (originalIdx !== -1) updated[originalIdx] = editData;
      setData(updated);
      setEditIdx(null);
      setEditData(null);
    }
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditData(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lista de Experimentos</h1>
      <StatusLegend />
      {/* Gerenciador de colunas */}
      <div className="mb-4">
        <span className="font-semibold text-gray-700 mr-2">Colunas ocultas:</span>
        {Object.keys(data[0] || {})
          .filter((col) => !col.toLowerCase().includes('unnamed'))
          .filter((col) => !col.toLowerCase().includes('datas perdidas'))
          .filter((col) => hiddenColumns.includes(col))
          .map((col) => (
            <button
              key={col}
              className="inline-flex items-center px-3 py-1 m-1 rounded bg-gray-200 text-gray-700 border border-gray-400 hover:bg-blue-100"
              onClick={() => toggleColumn(col)}
            >
              <Eye className="w-4 h-4 mr-1" /> {col}
            </button>
          ))}
        {hiddenColumns.length === 0 && <span className="text-gray-400">Nenhuma coluna oculta</span>}
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2 mb-2">
          {experimentacaoValues.map((val) => (
            <button
              key={val}
              className={`px-4 py-2 rounded font-medium border ${status === val ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} border-blue-600 transition`}
              onClick={() => setStatus(val)}
            >
              {val}
            </button>
          ))}
          <button
            className={`px-4 py-2 rounded font-medium border ${status === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} border-blue-600 transition`}
            onClick={() => setStatus('')}
          >
            Todos
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-96 text-gray-800 bg-white border border-gray-300"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            {Object.keys(data[0] || {})
              .filter((col) => !col.toLowerCase().includes('unnamed'))
              .filter((col) => !col.toLowerCase().includes('datas perdidas'))
              .map((col) => (
                !hiddenColumns.includes(col) && (
                  <TableHead key={col} className="relative group">
                    <span>{col}</span>
                    <button
                      className="absolute right-1 top-1 p-1 text-gray-500 hover:text-blue-600"
                      onClick={() => toggleColumn(col)}
                      title={hiddenColumns.includes(col) ? 'Exibir coluna' : 'Ocultar coluna'}
                    >
                      {hiddenColumns.includes(col) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </TableHead>
                )
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <button onClick={() => handleEdit(idx)} className="p-1 hover:bg-gray-100 rounded">
                  <Pencil className="w-4 h-4 text-blue-600" />
                </button>
              </TableCell>
              {columns.map((col) => (
                !hiddenColumns.includes(col) && (
                  <TableCell key={col}>
                    {col === '#' ? (
                      row[col] === '1.0' ? <BlinkingDot color="#ef4444" />
                      : row[col] === '2.0' ? <BlinkingDot color="#eab308" />
                      : row[col] === '3.0' ? <BlinkingDot color="#22c55e" />
                      : row[col]
                    ) : col.toLowerCase().includes('previsão de término') && row[col] ? (
                      row[col].split(' ')[0]
                    ) : row[col]}
                  </TableCell>
                )
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editIdx !== null && editData && (
        <EditCard
          columns={columns}
          editData={editData}
          onChange={handleEditChange}
          onCancel={handleEditCancel}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
