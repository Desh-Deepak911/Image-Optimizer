"use client";

import type { EditorLayer } from "@/types/konvaEditor";
import { getLayerTypeLabel } from "@/types/konvaEditor";

interface LayerPanelProps {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
}

function LayerActionButton({
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
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md p-1.5 text-[#86868b] transition-colors hover:bg-[#ebebed] hover:text-[#1d1d1f] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onToggleLock,
  onToggleVisibility,
}: LayerPanelProps) {
  const displayLayers = [...layers].reverse();

  return (
    <aside className="flex flex-col rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.04] px-4 py-4">
        <h2 className="text-base font-semibold text-[#1d1d1f]">Layers</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Select, reorder, and manage canvas layers
        </p>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto p-3">
        {displayLayers.length === 0 ? (
          <p className="rounded-xl bg-[#f5f5f7] px-3 py-4 text-center text-sm text-[#86868b]">
            Add images, text, or shapes to start composing.
          </p>
        ) : (
          displayLayers.map((layer, displayIndex) => {
            const stackIndex = layers.length - 1 - displayIndex;
            const isSelected = layer.id === selectedLayerId;

            return (
              <div
                key={layer.id}
                className={`rounded-xl border px-3 py-2.5 transition-colors ${
                  isSelected
                    ? "border-[#0071e3] bg-[#0071e3]/[0.06]"
                    : "border-black/[0.06] bg-[#f5f5f7]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectLayer(layer.id)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1d1d1f]">
                    {layer.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase text-[#86868b]">
                    {getLayerTypeLabel(layer)}
                  </span>
                  {layer.locked ? (
                    <span className="text-[10px] font-semibold uppercase text-[#86868b]">
                      Locked
                    </span>
                  ) : null}
                  {!layer.visible ? (
                    <span className="text-[10px] font-semibold uppercase text-[#86868b]">
                      Hidden
                    </span>
                  ) : null}
                </button>

                <div className="mt-2 flex flex-wrap gap-1">
                  <LayerActionButton
                    label={layer.visible ? "Hide" : "Show"}
                    onClick={() => onToggleVisibility(layer.id)}
                  />
                  <LayerActionButton
                    label={layer.locked ? "Unlock" : "Lock"}
                    onClick={() => onToggleLock(layer.id)}
                  />
                  <LayerActionButton
                    label="Duplicate"
                    onClick={() => onDuplicateLayer(layer.id)}
                  />
                  <LayerActionButton
                    label="Up"
                    disabled={stackIndex >= layers.length - 1}
                    onClick={() => onMoveLayerUp(layer.id)}
                  />
                  <LayerActionButton
                    label="Down"
                    disabled={stackIndex <= 0}
                    onClick={() => onMoveLayerDown(layer.id)}
                  />
                  <LayerActionButton
                    label="Delete"
                    onClick={() => onDeleteLayer(layer.id)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
