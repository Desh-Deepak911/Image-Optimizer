"use client";

import {
  CLEANUP_TOOL_HINTS,
  CLEANUP_TOOL_OPTIONS,
} from "@/lib/konva/cleanupTools";
import type { CleanupToolId, EditorLayer } from "@/types/konvaEditor";

interface CleanupToolsPanelProps {
  cleanupTool: CleanupToolId;
  brushSize: number;
  brushIntensity: number;
  selectedLayer: EditorLayer | null;
  cropEditingLayerId: string | null;
  onCleanupToolChange: (tool: CleanupToolId) => void;
  onBrushSizeChange: (size: number) => void;
  onBrushIntensityChange: (intensity: number) => void;
  onStartCropEdit: (layerId: string) => void;
  onFinishCropEdit: () => void;
  onResetCrop: (layerId: string) => void;
  onClearCleanupStrokes: (layerId: string) => void;
}

function isBrushTool(tool: CleanupToolId): boolean {
  return tool === "blur-brush" || tool === "pixelate-brush";
}

export function CleanupToolsPanel({
  cleanupTool,
  brushSize,
  brushIntensity,
  selectedLayer,
  cropEditingLayerId,
  onCleanupToolChange,
  onBrushSizeChange,
  onBrushIntensityChange,
  onStartCropEdit,
  onFinishCropEdit,
  onResetCrop,
  onClearCleanupStrokes,
}: CleanupToolsPanelProps) {
  const selectedImageLayer =
    selectedLayer?.type === "image" ? selectedLayer : null;
  const brushDisabled =
    !selectedImageLayer ||
    selectedLayer?.type !== "image" ||
    selectedLayer.locked;
  const isCropEditing =
    selectedImageLayer !== null &&
    cropEditingLayerId === selectedImageLayer.id;
  const hasCleanupStrokes =
    (selectedImageLayer?.cleanupStrokes?.length ?? 0) > 0;

  const handleToolSelect = (tool: CleanupToolId) => {
    onCleanupToolChange(tool);

    if (tool === "crop" && selectedImageLayer && !selectedImageLayer.locked) {
      onStartCropEdit(selectedImageLayer.id);
    }
  };

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Cleanup tools</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Blur, pixelate, cover, or crop sensitive areas — all in the browser
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
        {CLEANUP_TOOL_OPTIONS.map((tool) => {
          const isActive = cleanupTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleToolSelect(tool.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                  : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f] hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06]"
              }`}
            >
              <span className="block text-xs font-semibold">{tool.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 rounded-lg bg-[#f5f5f7] px-3 py-2 text-xs leading-relaxed text-[#86868b]">
        {CLEANUP_TOOL_HINTS[cleanupTool]}
      </p>

      {isBrushTool(cleanupTool) ? (
        <div className="mt-4 space-y-3">
          {brushDisabled ? (
            <p className="rounded-lg bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-700">
              Select an unlocked image layer to use brush tools. Text and shape
              layers are not supported.
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1d1d1f]">Brush size</span>
              <span className="text-[#86868b]">{brushSize}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={120}
              step={1}
              value={brushSize}
              onChange={(event) =>
                onBrushSizeChange(Number(event.target.value))
              }
              className="w-full accent-[#0071e3]"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1d1d1f]">
                {cleanupTool === "blur-brush"
                  ? "Blur strength"
                  : "Pixel size"}
              </span>
              <span className="text-[#86868b]">{brushIntensity}px</span>
            </div>
            <input
              type="range"
              min={cleanupTool === "blur-brush" ? 2 : 4}
              max={cleanupTool === "blur-brush" ? 40 : 48}
              step={1}
              value={brushIntensity}
              onChange={(event) =>
                onBrushIntensityChange(Number(event.target.value))
              }
              className="w-full accent-[#0071e3]"
            />
          </label>

          {selectedImageLayer && hasCleanupStrokes ? (
            <button
              type="button"
              onClick={() => onClearCleanupStrokes(selectedImageLayer.id)}
              className="text-xs font-medium text-[#0071e3] hover:underline"
            >
              Clear all cleanup strokes
            </button>
          ) : null}
        </div>
      ) : null}

      {cleanupTool === "crop" ? (
        <div className="mt-4 space-y-2">
          {!selectedImageLayer ? (
            <p className="rounded-lg bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-700">
              Select an image layer to crop it.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {isCropEditing ? (
                <button
                  type="button"
                  onClick={onFinishCropEdit}
                  className="rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0077ed]"
                >
                  Done cropping
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartCropEdit(selectedImageLayer.id)}
                  className="rounded-lg border border-black/[0.06] bg-[#f5f5f7] px-3 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30"
                >
                  Start crop
                </button>
              )}
              <button
                type="button"
                onClick={() => onResetCrop(selectedImageLayer.id)}
                className="rounded-lg border border-black/[0.06] bg-[#f5f5f7] px-3 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30"
              >
                Reset crop
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
