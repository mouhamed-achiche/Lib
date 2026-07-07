import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function SortDropdown({ value, onChange, options, label = "Trier par" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex w-full items-center justify-between gap-x-2 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-[14px] font-medium text-academic-blue shadow-sm hover:bg-surface-container transition-all cursor-pointer min-w-[220px]"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="truncate">
            <span className="text-on-surface-variant font-normal">{label} : </span>
            <span className="font-semibold">{selectedOption?.label}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-on-surface-variant transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-outline-variant bg-surface p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-surface-container font-semibold text-academic-blue"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                  role="menuitem"
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-academic-blue" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
