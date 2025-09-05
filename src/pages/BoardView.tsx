import { useExperimentos } from '@/hooks/useExperimentos';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BOARD_COLUMNS = [
  { key: 'Backlog', label: 'Backlog' },
  { key: 'Em prospecção', label: 'Em Prospecção' },
  { key: 'Em planejamento', label: 'Em Planejamento' },
  { key: 'Em refinamento', label: 'Em Refinamento' },
  { key: 'Em andamento', label: 'Em Andamento' },
  { key: 'Em Testes', label: 'Em Teste' },
  { key: 'Em validação', label: 'Em Validação' },
  { key: 'Bloqueado', label: 'Bloqueado' },
  { key: 'Cancelado', label: 'Cancelado' },
  { key: 'Itens concluídos', label: 'Itens Concluídos' },
];

function normalize(str: string) {
  return (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
}

export default function BoardView() {
  const { data } = useExperimentos();
  const [selected, setSelected] = useState<string | null>(null);

  // Agrupa experimentos por coluna
  const columns = BOARD_COLUMNS.map(col => {
    const items = data.filter(item => normalize(item['Experimentação']) === normalize(col.key));
    return { ...col, items };
  });

  return (
    <div className="flex gap-4 overflow-x-auto p-6 min-h-screen bg-background">
      {columns.map(col => (
        <div key={col.key} className="min-w-[260px] w-[260px] flex-shrink-0">
          <Card className="mb-4 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {col.label}
                <Badge variant="secondary">{col.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {col.items.length === 0 ? (
                  <span className="text-muted-foreground text-sm">Nenhum experimento</span>
                ) : (
                  col.items.map((item, idx) => (
                    <div key={item['Iniciativa'] || idx} className="rounded border bg-muted p-2 cursor-pointer hover:bg-accent" onClick={() => setSelected(item['Iniciativa'])}>
                      <div className="font-semibold text-sm mb-1">{item['Iniciativa']}</div>
                      <div className="text-xs text-muted-foreground">{item['Descrição']}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
