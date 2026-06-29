"use client";

import {
  EDITOR_TOOL_HINTS,
  EDITOR_TOOL_OPTIONS,
  isAnnotationTool,
  isDrawingTool,
} from "@/lib/konva/annotationTools";
import type { DrawingToolSettings, EditorToolId } from "@/types/konvaEditor";

interface DrawingToolsPanelProps {
  editorTool: EditorToolId;
  drawingSettings: DrawingToolSettings;
  onEditorToolChange: (tool: EditorToolId) => void;
  onDrawingSettingChange: <K extends keyof DrawingToolSettings>(
    key: K,
    value: DrawingToolSettings[K],
  ) => void;
}

export function DrawingToolsPanel({
  editorTool,
  drawingSettings,
  onEditorToolChange,
  onDrawingSettingChange,
}: DrawingToolsPanelProps) {
  const showStrokeControls = isDrawingTool(editorTool);
  const showArrowControls = editorTool === "arrow";
  const showCalloutControls =
    editorTool === "label" ||
    editorTool === "speech-bubble" ||
    editorTool === "numbered-marker";

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Drawing tools</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Lines, arrows, highlights, and callouts
        </p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-4 lg:grid-cols-4">
        {EDITOR_TOOL_OPTIONS.map((tool) => {
          const isActive = editorTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onEditorToolChange(tool.id)}
              className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                isActive
                  ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                  : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f] hover:border-[#0071e3]/30"
              }`}
            >
              <span className="block text-[11px] font-semibold">
                {tool.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 rounded-lg bg-[#f5f5f7] px-3 py-2 text-xs leading-relaxed text-[#86868b]">
        {EDITOR_TOOL_HINTS[editorTool]}
      </p>

      {showStrokeControls ? (
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#1d1d1f]">Stroke</span>
            <input
              type="color"
              value={drawingSettings.strokeColor}
              onChange={(event) =>
                onDrawingSettingChange("strokeColor", event.target.value)
              }
              className="h-9 w-14 cursor-pointer rounded-lg border border-black/[0.08] bg-white"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1d1d1f]">Stroke width</span>
              <span className="text-[#86868b]">{drawingSettings.strokeWidth}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={32}
              step={1}
              value={drawingSettings.strokeWidth}
              onChange={(event) =>
                onDrawingSettingChange("strokeWidth", Number(event.target.value))
              }
              className="w-full accent-[#0071e3]"
            />
          </label>

          {editorTool !== "highlighter" ? (
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1d1d1f]">Opacity</span>
                <span className="text-[#86868b]">
                  {Math.round(drawingSettings.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.01}
                value={drawingSettings.opacity}
                onChange={(event) =>
                  onDrawingSettingChange("opacity", Number(event.target.value))
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
          ) : (
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1d1d1f]">
                  Highlight opacity
                </span>
                <span className="text-[#86868b]">
                  {Math.round(drawingSettings.highlighterOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.01}
                value={drawingSettings.highlighterOpacity}
                onChange={(event) =>
                  onDrawingSettingChange(
                    "highlighterOpacity",
                    Number(event.target.value),
                  )
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
          )}

          {editorTool === "line" || editorTool === "arrow" ? (
            <label className="flex items-center gap-2 text-xs text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={drawingSettings.dashed}
                onChange={(event) =>
                  onDrawingSettingChange("dashed", event.target.checked)
                }
              />
              Dashed stroke
            </label>
          ) : null}

          {showArrowControls ? (
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1d1d1f]">Arrow head</span>
                <span className="text-[#86868b]">
                  {drawingSettings.arrowHeadSize}px
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={32}
                step={1}
                value={drawingSettings.arrowHeadSize}
                onChange={(event) =>
                  onDrawingSettingChange(
                    "arrowHeadSize",
                    Number(event.target.value),
                  )
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {showCalloutControls ? (
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#1d1d1f]">Fill</span>
            <input
              type="color"
              value={drawingSettings.calloutFill}
              onChange={(event) =>
                onDrawingSettingChange("calloutFill", event.target.value)
              }
              className="h-9 w-14 cursor-pointer rounded-lg border border-black/[0.08] bg-white"
            />
          </label>
          <label className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#1d1d1f]">Text</span>
            <input
              type="color"
              value={drawingSettings.calloutTextColor}
              onChange={(event) =>
                onDrawingSettingChange("calloutTextColor", event.target.value)
              }
              className="h-9 w-14 cursor-pointer rounded-lg border border-black/[0.08] bg-white"
            />
          </label>
        </div>
      ) : null}

      {isAnnotationTool(editorTool) ? (
        <p className="mt-3 text-[11px] text-[#86868b]">
          Press Esc to return to Select.
        </p>
      ) : null}
    </div>
  );
}
