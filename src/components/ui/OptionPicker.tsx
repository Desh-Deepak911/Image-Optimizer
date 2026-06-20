"use client";

interface OptionPickerItem<T extends string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  helper?: string;
}

interface OptionPickerProps<T extends string> {
  label: string;
  value: T;
  options: OptionPickerItem<T>[];
  onChange: (value: T) => void;
  layout?: "list" | "grid";
  showSelectedHelper?: boolean;
}

export function OptionPicker<T extends string>({
  label,
  value,
  options,
  onChange,
  layout = "list",
  showSelectedHelper = false,
}: OptionPickerProps<T>) {
  const containerClass =
    layout === "grid"
      ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
      : "flex flex-col gap-2";

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="space-y-3">
      <div className={containerClass} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                isSelected
                  ? "border-[#0071e3] bg-[#0071e3]/[0.06] shadow-sm"
                  : "border-black/[0.06] bg-[#f5f5f7] hover:border-black/[0.1] hover:bg-[#ebebed]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-[#0071e3] bg-[#0071e3]"
                    : "border-[#d2d2d7] bg-white group-hover:border-[#86868b]"
                }`}
                aria-hidden="true"
              >
                {isSelected ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1d1d1f]">
                    {option.label}
                  </span>
                  {option.badge ? (
                    <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">
                      {option.badge}
                    </span>
                  ) : null}
                </span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-[#86868b]">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {showSelectedHelper && selectedOption?.helper ? (
        <p className="rounded-xl bg-[#f5f5f7] px-3.5 py-3 text-xs leading-relaxed text-[#6e6e73]">
          <span className="font-medium text-[#1d1d1f]">
            {selectedOption.label}:
          </span>{" "}
          {selectedOption.helper}
        </p>
      ) : null}
    </div>
  );
}
