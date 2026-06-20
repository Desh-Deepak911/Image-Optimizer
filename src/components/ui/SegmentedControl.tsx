"use client";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  columns?: 2 | 3;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 3,
}: SegmentedControlProps<T>) {
  const gridClass =
    columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div
      className={`grid gap-1 rounded-xl bg-[#f5f5f7] p-1 ${gridClass}`}
      role="radiogroup"
      aria-label={label}
    >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
    </div>
  );
}
