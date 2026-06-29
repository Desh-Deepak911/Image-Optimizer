"use client";

import type { LayerAlignment } from "@/lib/konva/layerBounds";

interface LayerAlignmentControlsProps {
  disabled?: boolean;
  onAlign: (alignment: LayerAlignment) => void;
}

const ALIGNMENT_BUTTONS: { id: LayerAlignment; label: string }[] = [
  { id: "left", label: "Left" },
  { id: "center-h", label: "Center H" },
  { id: "right", label: "Right" },
  { id: "top", label: "Top" },
  { id: "center-v", label: "Middle" },
  { id: "bottom", label: "Bottom" },
];

export function LayerAlignmentControls({
  disabled = false,
  onAlign,
}: LayerAlignmentControlsProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Alignment</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Align the selected layer to the canvas
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {ALIGNMENT_BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            disabled={disabled}
            onClick={() => onAlign(button.id)}
            className="rounded-lg border border-black/[0.06] bg-[#f5f5f7] px-2 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
