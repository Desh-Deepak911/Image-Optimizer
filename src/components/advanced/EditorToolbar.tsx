"use client";

import type { ShapeKind } from "@/types/konvaEditor";

interface EditorToolbarProps {
  onAddText: () => void;
  onAddShape: (shape: ShapeKind) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function ToolButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function EditorToolbar({
  onAddText,
  onAddShape,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorToolbarProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1d1d1f]">Add elements</p>
          <p className="mt-0.5 text-xs text-[#86868b]">
            Text, shapes, and uploaded images compose your canvas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToolButton label="Undo" onClick={onUndo} disabled={!canUndo} />
          <ToolButton label="Redo" onClick={onRedo} disabled={!canRedo} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ToolButton label="Text" onClick={onAddText} />
        <ToolButton label="Rectangle" onClick={() => onAddShape("rectangle")} />
        <ToolButton label="Circle" onClick={() => onAddShape("circle")} />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[#86868b]">
        Shortcuts: Delete to remove layer · ⌘/Ctrl+Z undo · ⌘/Ctrl+Shift+Z redo · Esc to Select
      </p>
    </div>
  );
}
