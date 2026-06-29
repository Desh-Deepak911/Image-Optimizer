"use client";

interface CanvasZoomControlsProps {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
}

function ZoomButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-md border border-black/[0.08] bg-white/95 px-2.5 py-1.5 text-xs font-medium text-[#1d1d1f] shadow-sm transition-colors hover:bg-[#f5f5f7]"
    >
      {label}
    </button>
  );
}

export function CanvasZoomControls({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
}: CanvasZoomControlsProps) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1.5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-black/[0.08] bg-white/95 p-1 shadow-sm backdrop-blur-sm">
        <ZoomButton label="−" onClick={onZoomOut} />
        <span className="min-w-12 px-1 text-center text-xs font-medium text-[#86868b]">
          {zoomPercent}%
        </span>
        <ZoomButton label="+" onClick={onZoomIn} />
        <ZoomButton label="100%" onClick={onResetZoom} />
        <ZoomButton label="Fit" onClick={onFitToScreen} />
      </div>
    </div>
  );
}
