import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Pencil, Eye, EyeOff } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { ColumnFilterDropdown } from '../components/ui/ColumnFilterDropdown';

const IDEA_OPTIONS = [
  'Selecionar tudo', 'Backlog', 'Em Backlog', 'Arquivado', 'Concluido', 'Concluído', 'Em prospecção', 'Não iniciado', 'Para'
];
const EXPERIMENTACAO_OPTIONS = [
  'Selecionar tudo', 'Vazias', 'Aguardando', 'Arquivado', 'Concluido', 'Concluído-Aguardando GO/ NO GO', 'Concluido com Arquivamento', 'Concluido com Pivot', 'Em Andamento', 'Em planejamento', 'Em refinamento', 'Em validação'
];
const PILOTO_OPTIONS = [
  'Selecionar tudo', 'Vazias', 'Concluido', 'Em andamento', 'Nõa iniciado'
];
const ESCALA_OPTIONS = [
  'Selecionar tudo', 'Vazias', 'Arquivado', 'Em produtização'
];

function BlinkingDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full animate-pulse"
      style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}` }}
    />
  );
}

export default function ListaDeExperimentos() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [ideaFilter, setIdeaFilter] = useState<string[]>(['Selecionar tudo']);
  const [experimentacaoFilter, setExperimentacaoFilter] = useState<string[]>(['Selecionar tudo']);
  const [pilotoFilter, setPilotoFilter] = useState<string[]>(['Selecionar tudo']);
  const [escalaFilter, setEscalaFilter] = useState<string[]>(['Selecionar tudo']);

  useEffect(() => {
    fetch('/planilha1.csv')
      .then((res) => res.text())
      .then((csv) => {
        const result = Papa.parse(csv, { header: true });
        setData(result.data as any[]);
        setFiltered(result.data as any[]);
      });
  }, []);

  useEffect(() => {
    let temp = data;
    if (!ideaFilter.includes('Selecionar tudo')) {
      temp = temp.filter((item) =>
        ideaFilter.some(f => (item['Ideia / Problema / Oportunidade'] || '').trim().toLowerCase() === f.trim().toLowerCase())
      );
    }
    if (!experimentacaoFilter.includes('Selecionar tudo')) {
      temp = temp.filter((item) =>
        experimentacaoFilter.some(f => (item['Experimentação'] || '').trim().toLowerCase() === f.trim().toLowerCase())
      );
    }
    if (!pilotoFilter.includes('Selecionar tudo')) {
      temp = temp.filter((item) =>
        pilotoFilter.some(f => (item['Piloto'] || '').trim().toLowerCase() === f.trim().toLowerCase())
      );
    }
    if (!escalaFilter.includes('Selecionar tudo')) {
      temp = temp.filter((item) =>
        escalaFilter.some(f => (item['Escala'] || '').trim().toLowerCase() === f.trim().toLowerCase())
      );
    }
    if (search) {
      temp = temp.filter((item) =>
        Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()))
      );
    }
    setFiltered(temp);
  }, [data, ideaFilter, experimentacaoFilter, pilotoFilter, escalaFilter, search]);

  const columns = data.length > 0
    ? Object.keys(data[0])
        .filter((col) => !col.toLowerCase().includes('unnamed'))
        .filter((col) => !col.toLowerCase().includes('datas perdidas'))
        .filter((col) => !hiddenColumns.includes(col))
    : [];

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({ ...filtered[idx] });
    setSelectedIdx(idx);
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
  const toggleColumn = (col: string) => {
    setHiddenColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lista de Experimentos</h1>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2 mb-2">
          <ColumnFilterDropdown options={IDEA_OPTIONS} selected={ideaFilter} onChange={setIdeaFilter} label="Ideia/Problema/Oportunidade" />
          <ColumnFilterDropdown options={EXPERIMENTACAO_OPTIONS} selected={experimentacaoFilter} onChange={setExperimentacaoFilter} label="Experimentação" />
          <ColumnFilterDropdown options={PILOTO_OPTIONS} selected={pilotoFilter} onChange={setPilotoFilter} label="Piloto" />
          <ColumnFilterDropdown options={ESCALA_OPTIONS} selected={escalaFilter} onChange={setEscalaFilter} label="Escala" />
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
            <TableHead>#</TableHead>
            <TableHead></TableHead>
            {columns.map((col) => (
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
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row, idx) => (
            <TableRow
              key={idx}
              className={
                selectedIdx === idx
                  ? "border-2 border-blue-500 rounded-lg shadow-lg bg-blue-50 transition-all duration-200"
                  : "hover:border-blue-300 hover:bg-blue-100 cursor-pointer transition-all duration-200"
              }
              onClick={() => setSelectedIdx(idx)}
            >
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <button onClick={() => handleEdit(idx)} className="p-1 hover:bg-gray-100 rounded">
                  <Pencil className="w-4 h-4 text-blue-600" />
                </button>
              </TableCell>
              {columns.map((col) => (
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
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editIdx !== null && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl flex flex-col">
            <h2 className="text-xl font-bold mb-4">Editar Experimento</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {columns.map((col) => (
                <div key={col} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">{col}</label>
                  <input
                    className="border rounded px-2 py-1 text-gray-800"
                    value={editData[col] || ''}
                    onChange={(e) => handleEditChange(col, e.target.value)}
                    disabled={col === '#'}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={handleEditCancel} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancelar</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded bg-blue-600 text-white">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
