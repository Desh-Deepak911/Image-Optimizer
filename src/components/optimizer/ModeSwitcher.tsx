"use client";

import type { AppMode } from "@/types/konvaEditor";

interface ModeSwitcherProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const MODES: { id: AppMode; label: string; shortLabel: string }[] = [
  { id: "optimizer", label: "Optimizer", shortLabel: "Optimizer" },
  { id: "batch", label: "Batch export", shortLabel: "Batch" },
  { id: "advanced", label: "Advanced editor", shortLabel: "Editor" },
];

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="mx-auto flex max-w-2xl justify-center px-4 pb-4 sm:px-6">
      <div
        className="inline-flex w-full rounded-full bg-[#f5f5f7] p-1"
        role="tablist"
        aria-label="Editor mode"
      >
        {MODES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={mode === entry.id}
            onClick={() => onModeChange(entry.id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
              mode === entry.id
                ? "bg-white text-[#1d1d1f] shadow-sm"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            <span className="sm:hidden">{entry.shortLabel}</span>
            <span className="hidden sm:inline">{entry.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
