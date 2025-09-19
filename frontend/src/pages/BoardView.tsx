import { useExperimentos } from "@/hooks/useExperimentos";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExperimentEditModal } from "@/components/experimentos/ExperimentEditModal";
import { Badge } from "@/components/ui/badge";

const BOARD_COLUMNS = [
  { key: "Backlog", label: "Backlog" },
  { key: "Em prospecção", label: "Em Prospecção" },
  { key: "Em planejamento", label: "Em Planejamento" },
  { key: "Em refinamento", label: "Em Refinamento" },
  { key: "Em andamento", label: "Em Andamento" },
  { key: "Em Testes", label: "Em Teste" },
  { key: "Em validação", label: "Em Validação" },
  { key: "Bloqueado", label: "Bloqueado" },
  { key: "Cancelado", label: "Cancelado" },
  { key: "Itens concluídos", label: "Itens Concluídos" },
];

function normalize(str: string) {
  return (str || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export default function BoardView() {
  const { data } = useExperimentos();
  const [selected, setSelected] = useState<Record<string, string> | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Agrupa experimentos por coluna
  const columns = BOARD_COLUMNS.map((col) => {
    const items = data.filter(
      (item) =>
        typeof item["Experimentação"] === "string" &&
        normalize(item["Experimentação"]) === normalize(col.key)
    );
    return { ...col, items };
  });

  // ...existing code...
  return (
    <>
      <div className="flex gap-4 overflow-x-auto p-6 min-h-screen bg-background">
        {columns.map((col) => (
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
                    <span className="text-muted-foreground text-sm">
                      Nenhum experimento
                    </span>
                  ) : (
                    col.items.map((item, idx) => (
                      <div
                        key={
                          typeof item["Iniciativa"] === "string" ||
                          typeof item["Iniciativa"] === "number"
                            ? item["Iniciativa"]
                            : idx
                        }
                        className="rounded border bg-muted p-2 cursor-pointer hover:bg-accent"
                        onClick={() => {
                          // Converte Experimento para Record<string, string>
                          const stringFields: Record<string, string> = {};
                          Object.entries(item).forEach(([key, value]) => {
                            if (typeof value === "string")
                              stringFields[key] = value;
                          });
                          setSelected(stringFields);
                          setEditOpen(true);
                        }}
                      >
                        <div className="font-semibold text-sm mb-1">
                          {typeof item["Iniciativa"] === "string"
                            ? item["Iniciativa"]
                            : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {typeof item["Descrição"] === "string"
                            ? item["Descrição"]
                            : "Sem descrição"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {editOpen && selected && (
        <ExperimentEditModal
          open={editOpen}
          columns={Object.keys(selected)}
          editData={selected}
          onChange={(key, value) =>
            setSelected((prev) => (prev ? { ...prev, [key]: value } : prev))
          }
          onCancel={() => setEditOpen(false)}
          onSave={() => setEditOpen(false)}
          onDelete={() => setEditOpen(false)}
          optionsMap={{}}
        />
      )}
    </>
  );
}
