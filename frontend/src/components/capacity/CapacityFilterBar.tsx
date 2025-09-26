import React, { useState } from "react";
import { DEVELOPERS } from "./mockCapacityData";

export function CapacityFilterBar({
  onFilter,
}: {
  onFilter: (dev: string) => void;
}) {
  const [selected, setSelected] = useState("");
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
      <label className="font-semibold text-gray-700">Filtrar por Dev:</label>
      <select
        className="border rounded px-3 py-2 text-gray-700"
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
