import React, { useState } from 'react';

interface InlineDropdownProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

export function InlineDropdown({ value, options, onChange }: InlineDropdownProps) {
  return (
    <select
      className="border-2 border-[#7a0019]/30 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7a0019]/40 transition-all duration-300 ease-in-out w-full"
      value={value}
      onChange={e => {
        onChange(e.target.value);
      }}
    >
      <option value="">Selecione...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
