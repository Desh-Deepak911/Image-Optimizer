"use client";

import type { AppMode } from "@/types/konvaEditor";

interface ModeSwitcherProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="mx-auto flex max-w-md justify-center px-4 pb-4 sm:px-6">
      <div
        className="inline-flex w-full rounded-full bg-[#f5f5f7] p-1"
        role="tablist"
        aria-label="Editor mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "optimizer"}
          onClick={() => onModeChange("optimizer")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            mode === "optimizer"
              ? "bg-white text-[#1d1d1f] shadow-sm"
              : "text-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          Optimizer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "advanced"}
          onClick={() => onModeChange("advanced")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            mode === "advanced"
              ? "bg-white text-[#1d1d1f] shadow-sm"
              : "text-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          Advanced editor
        </button>
      </div>
    </div>
  );
}
