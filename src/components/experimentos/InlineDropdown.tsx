import React, { useState } from 'react';

interface InlineDropdownProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

export function InlineDropdown({ value, options, onChange }: InlineDropdownProps) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <select
      className="border rounded px-2 py-1 text-gray-800"
      value={value}
      autoFocus
      onBlur={() => setEditing(false)}
      onChange={e => {
        setEditing(false);
        onChange(e.target.value);
      }}
    >
      <option value="">Selecione...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  ) : (
    <span
      className="cursor-pointer hover:underline"
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      {value || <span className="text-gray-400">(vazio)</span>}
    </span>
  );
}
