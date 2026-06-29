"use client";

import type {
  EditorLayerUpdate,
  TextAlign,
  TextEditorLayer,
  TextFontStyle,
} from "@/types/konvaEditor";
import {
  DEFAULT_TEXT_FONT_FAMILY,
  TEXT_FONT_FAMILY_OPTIONS,
} from "@/types/konvaEditor";

interface TextSettingsPanelProps {
  layer: TextEditorLayer;
  onUpdateLayer: (
    layerId: string,
    update: EditorLayerUpdate,
    recordHistory?: boolean,
  ) => void;
  onHistoryCheckpoint: () => void;
}

export function TextSettingsPanel({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: TextSettingsPanelProps) {
  const isBold =
    layer.fontStyle === "bold" || layer.fontStyle === "bold italic";
  const isItalic =
    layer.fontStyle === "italic" || layer.fontStyle === "bold italic";

  const setFontStyle = (nextStyle: TextFontStyle) => {
    onUpdateLayer(layer.id, { fontStyle: nextStyle });
  };

  const toggleBold = () => {
    const nextBold = !isBold;
    setFontStyle(
      nextBold && isItalic
        ? "bold italic"
        : nextBold
          ? "bold"
          : isItalic
            ? "italic"
            : "normal",
    );
  };

  const toggleItalic = () => {
    const nextItalic = !isItalic;
    setFontStyle(
      isBold && nextItalic
        ? "bold italic"
        : isBold
          ? "bold"
          : nextItalic
            ? "italic"
            : "normal",
    );
  };

  return (
    <div className="rounded-2xl border border-[#0071e3]/30 bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Text settings</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Edit content and typography for the selected text layer
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#1d1d1f]">Text</span>
          <textarea
            key={layer.id}
            value={layer.text ?? ""}
            rows={4}
            autoFocus
            onFocus={onHistoryCheckpoint}
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
            onChange={(event) =>
              onUpdateLayer(layer.id, { text: event.target.value }, false)
            }
            onBlur={() => onHistoryCheckpoint()}
            placeholder="Type your text here…"
            className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
          />
        </label>

        <label className="block space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#1d1d1f]">Font size</span>
            <span className="text-[#86868b]">{layer.fontSize}px</span>
          </div>
          <input
            type="range"
            min={12}
            max={160}
            step={1}
            value={layer.fontSize}
            onPointerDown={onHistoryCheckpoint}
            onChange={(event) =>
              onUpdateLayer(
                layer.id,
                { fontSize: Number(event.target.value) },
                false,
              )
            }
            className="h-2 w-full cursor-pointer accent-[#0071e3]"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[#1d1d1f]">Text color</span>
          <input
            type="color"
            value={layer.fill}
            onChange={(event) =>
              onUpdateLayer(layer.id, { fill: event.target.value })
            }
            className="h-9 w-14 cursor-pointer rounded-md border border-black/[0.08] bg-white p-1"
          />
        </label>

        <label className="block space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#1d1d1f]">Opacity</span>
            <span className="text-[#86868b]">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.opacity}
            onPointerDown={onHistoryCheckpoint}
            onChange={(event) =>
              onUpdateLayer(
                layer.id,
                { opacity: Number(event.target.value) },
                false,
              )
            }
            className="h-2 w-full cursor-pointer accent-[#0071e3]"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={isBold}
            onClick={toggleBold}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              isBold
                ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f]"
            }`}
          >
            Bold
          </button>
          <button
            type="button"
            aria-pressed={isItalic}
            onClick={toggleItalic}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold italic transition-colors ${
              isItalic
                ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f]"
            }`}
          >
            Italic
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["left", "center", "right"] as TextAlign[]).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => onUpdateLayer(layer.id, { align })}
              className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                (layer.align ?? "left") === align
                  ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                  : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f]"
              }`}
            >
              {align}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#1d1d1f]">Font family</span>
          <select
            value={layer.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY}
            onChange={(event) =>
              onUpdateLayer(layer.id, { fontFamily: event.target.value })
            }
            className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
          >
            {TEXT_FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
