import React, { useState } from "react";
import { DEVELOPERS } from "./mockCapacityData";

export function CapacityFilterBar({
  onFilter,
}: {
  onFilter: (dev: string) => void;
}) {
  const [selected, setSelected] = useState("");
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <label className="text-sm text-muted-foreground">Filtrar por Dev</label>
      <select
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          onFilter(e.target.value);
        }}
      >
        <option value="">Todos</option>
        {DEVELOPERS.map((dev) => (
          <option key={dev.nome} value={dev.nome}>
            {dev.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
