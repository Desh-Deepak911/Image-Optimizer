"use client";

import type { EditorLayer } from "@/types/konvaEditor";

interface LayerQuickActionsProps {
  selectedLayer: EditorLayer | null;
  onCenter: () => void;
  onFitToCanvas: () => void;
  onFillCanvas: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onResetEffects: () => void;
}

function ActionButton({
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
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function LayerQuickActions({
  selectedLayer,
  onCenter,
  onFitToCanvas,
  onFillCanvas,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onResetEffects,
}: LayerQuickActionsProps) {
  const isImage = selectedLayer?.type === "image";

  return (
    <aside className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Layer actions</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          {selectedLayer
            ? `Quick edits for ${selectedLayer.name}`
            : "Select a layer to see quick actions"}
        </p>
      </div>

      {selectedLayer ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton label="Center" onClick={onCenter} />
          {isImage ? (
            <>
              <ActionButton label="Fit canvas" onClick={onFitToCanvas} />
              <ActionButton label="Fill canvas" onClick={onFillCanvas} />
              <ActionButton label="Reset effects" onClick={onResetEffects} />
            </>
          ) : null}
          <ActionButton label="Duplicate" onClick={onDuplicate} />
          <ActionButton label="Forward" onClick={onBringForward} />
          <ActionButton label="Backward" onClick={onSendBackward} />
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-[#f5f5f7] px-3 py-3 text-xs text-[#86868b]">
          Click a layer on the canvas or in the layer list.
        </p>
      )}
    </aside>
  );
}
