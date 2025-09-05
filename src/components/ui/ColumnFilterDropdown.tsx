import React, { useState, useRef, useEffect } from "react";

interface ColumnFilterDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export const ColumnFilterDropdown: React.FC<ColumnFilterDropdownProps> = ({ options, selected, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => setOpen((prev) => !prev);

  const handleSelect = (option: string) => {
    if (option === "Selecionar tudo") {
      onChange(["Selecionar tudo"]);
      return;
    }
    let newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected.filter((item) => item !== "Selecionar tudo"), option];
    if (newSelected.length === 0) newSelected = ["Selecionar tudo"];
    onChange(newSelected);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        className="px-2 py-1 rounded border border-blue-600 bg-white text-gray-800 text-xs flex items-center gap-1"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {label || "Filtrar"}
      </button>
      {open && (
        <div className="absolute left-0 mt-1 z-[9999] bg-white border border-gray-300 rounded shadow-lg min-w-[160px] max-h-60 overflow-auto">
          {options.map((option) => (
            <label key={option} className="flex items-center px-2 py-1 cursor-pointer hover:bg-blue-50">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleSelect(option)}
                className="mr-2"
              />
              <span className="text-xs">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
