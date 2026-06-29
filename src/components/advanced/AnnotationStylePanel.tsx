"use client";

import { useCallback, useMemo, useState } from "react";
import {
  applyAnnotationStylePreset,
  loadRecentAnnotationColors,
  trackRecentAnnotationColor,
} from "@/lib/konva/annotationStyle";
import type {
  AnnotationStyle,
  AnnotationStylePresetId,
  ArrowHeadStyle,
  LineCapStyle,
  LineJoinStyle,
  StrokeDashStyle,
} from "@/types/annotationStyle";
import {
  ANNOTATION_COLOR_PALETTE,
  ANNOTATION_STYLE_PRESETS,
} from "@/types/annotationStyle";

export type AnnotationStylePanelContext =
  | "line"
  | "arrow"
  | "freehand"
  | "highlighter"
  | "rectangle"
  | "circle"
  | "callout"
  | "marker";

interface AnnotationStylePanelProps {
  style: AnnotationStyle;
  context: AnnotationStylePanelContext;
  onChange: (update: Partial<AnnotationStyle>) => void;
  onHistoryCheckpoint?: () => void;
  compact?: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.padStart(6, "0").slice(0, 6);

  return {
    r: Number.parseInt(value.slice(0, 2), 16) || 0,
    g: Number.parseInt(value.slice(2, 4), 16) || 0,
    b: Number.parseInt(value.slice(4, 6), 16) || 0,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
      {children}
    </p>
  );
}

export function AnnotationStylePanel({
  style,
  context,
  onChange,
  onHistoryCheckpoint,
  compact = false,
}: AnnotationStylePanelProps) {
  const [recentColors, setRecentColors] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : loadRecentAnnotationColors(),
  );
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const hexInput = hexDraft ?? style.strokeColor;
  const rgb = useMemo(() => hexToRgb(style.strokeColor), [style.strokeColor]);

  const applyColor = useCallback(
    (color: string, target: "stroke" | "fill" | "both" = "both") => {
      const nextRecent = trackRecentAnnotationColor(color);
      setRecentColors(nextRecent);
      setHexDraft(null);

      if (target === "stroke") {
        onChange({ strokeColor: color });
        return;
      }

      if (target === "fill") {
        onChange({ fill: color });
        return;
      }

      onChange({ strokeColor: color, fill: color });
    },
    [onChange],
  );

  const showArrowControls = context === "arrow";
  const showLineControls = context === "line" || context === "freehand";
  const showCalloutControls =
    context === "callout" || context === "marker";
  const showFillControls =
    context === "rectangle" ||
    context === "circle" ||
    context === "callout" ||
    context === "marker" ||
    context === "highlighter";

  const updateShadow = (update: Partial<AnnotationStyle["shadow"]>) => {
    onChange({ shadow: { ...style.shadow, ...update } });
  };

  const updateGlow = (update: Partial<AnnotationStyle["glow"]>) => {
    onChange({ glow: { ...style.glow, ...update } });
  };

  return (
    <div className={`space-y-4 ${compact ? "" : "border-t border-black/[0.06] pt-4"}`}>
      <div>
        <SectionTitle>Style presets</SectionTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(ANNOTATION_STYLE_PRESETS) as AnnotationStylePresetId[]).map(
            (presetId) => (
              <button
                key={presetId}
                type="button"
                onClick={() =>
                  onChange(applyAnnotationStylePreset(presetId, style))
                }
                className="rounded-lg border border-black/[0.08] bg-[#f5f5f7] px-2.5 py-1.5 text-[11px] font-semibold text-[#1d1d1f] hover:border-[#0071e3]/30"
              >
                {ANNOTATION_STYLE_PRESETS[presetId].label}
              </button>
            ),
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Color palette</SectionTitle>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {ANNOTATION_COLOR_PALETTE.map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              onClick={() => applyColor(swatch.value)}
              className={`aspect-square rounded-lg border-2 transition-transform hover:scale-105 ${
                style.strokeColor.toLowerCase() === swatch.value.toLowerCase()
                  ? "border-[#0071e3]"
                  : "border-black/10"
              }`}
              style={{ backgroundColor: swatch.value }}
            />
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#86868b]">Custom HEX</span>
            <input
              type="text"
              value={hexInput}
              onChange={(event) => setHexDraft(event.target.value)}
              onBlur={() => {
                if (/^#?[0-9a-fA-F]{3,8}$/.test(hexInput.trim())) {
                  const normalized = hexInput.startsWith("#")
                    ? hexInput
                    : `#${hexInput}`;
                  applyColor(normalized);
                } else {
                  setHexDraft(null);
                }
              }}
              className="w-full rounded-lg border border-black/[0.08] bg-[#f5f5f7] px-2 py-1.5 text-xs font-mono text-[#1d1d1f]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#86868b]">Picker</span>
            <input
              type="color"
              value={style.strokeColor}
              onChange={(event) => applyColor(event.target.value)}
              className="h-[34px] w-14 cursor-pointer rounded-lg border border-black/[0.08] bg-white"
            />
          </label>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["r", "g", "b"] as const).map((channel, index) => {
            const value = [rgb.r, rgb.g, rgb.b][index];
            const label = channel.toUpperCase();

            return (
              <label key={channel} className="block space-y-1">
                <span className="text-[11px] font-medium text-[#86868b]">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={value}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    const channels = [rgb.r, rgb.g, rgb.b];
                    channels[index] = next;
                    applyColor(rgbToHex(channels[0], channels[1], channels[2]));
                  }}
                  className="w-full rounded-lg border border-black/[0.08] bg-[#f5f5f7] px-2 py-1.5 text-xs tabular-nums"
                />
              </label>
            );
          })}
        </div>

        {recentColors.length > 0 ? (
          <div className="mt-3">
            <span className="text-[11px] font-medium text-[#86868b]">
              Recently used
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {recentColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => applyColor(color)}
                  className="size-6 rounded-md border border-black/10"
                  style={{ backgroundColor: color }}
                  aria-label={`Recent color ${color}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {showFillControls ? (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[#1d1d1f]">Fill color</span>
          <input
            type="color"
            value={style.fill}
            onChange={(event) => {
              applyColor(event.target.value, "fill");
            }}
            className="h-9 w-14 cursor-pointer rounded-md border border-black/[0.08] bg-white p-1"
          />
        </label>
      ) : null}

      {showCalloutControls ? (
        <>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#1d1d1f]">Text color</span>
            <input
              type="color"
              value={style.textColor}
              onChange={(event) => onChange({ textColor: event.target.value })}
              className="h-9 w-14 cursor-pointer rounded-md border border-black/[0.08] bg-white p-1"
            />
          </label>
          {context !== "marker" ? (
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1d1d1f]">Font size</span>
                <span className="text-[#86868b]">{style.fontSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={48}
                step={1}
                value={style.fontSize}
                onPointerDown={onHistoryCheckpoint}
                onChange={(event) =>
                  onChange({ fontSize: Number(event.target.value) })
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
          ) : null}
        </>
      ) : null}

      {context === "rectangle" ? (
        <label className="block space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#1d1d1f]">Corner radius</span>
            <span className="text-[#86868b]">{style.cornerRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={64}
            step={1}
            value={style.cornerRadius}
            onPointerDown={onHistoryCheckpoint}
            onChange={(event) =>
              onChange({ cornerRadius: Number(event.target.value) })
            }
            className="w-full accent-[#0071e3]"
          />
        </label>
      ) : null}

      {context === "freehand" ? (
        <label className="block space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#1d1d1f]">Smoothness</span>
            <span className="text-[#86868b]">{style.tension.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={style.tension}
            onPointerDown={onHistoryCheckpoint}
            onChange={(event) =>
              onChange({ tension: Number(event.target.value) })
            }
            className="w-full accent-[#0071e3]"
          />
        </label>
      ) : null}

      <div>
        <SectionTitle>Stroke</SectionTitle>
        <div className="mt-2 space-y-3">
          <label className="block space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1d1d1f]">Width</span>
              <span className="text-[#86868b]">{style.strokeWidth}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={style.strokeWidth}
              onPointerDown={onHistoryCheckpoint}
              onChange={(event) =>
                onChange({ strokeWidth: Number(event.target.value) })
              }
              className="w-full accent-[#0071e3]"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(["solid", "dashed", "dotted"] as StrokeDashStyle[]).map((dash) => (
              <button
                key={dash}
                type="button"
                onClick={() => onChange({ strokeDash: dash })}
                className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize ${
                  style.strokeDash === dash
                    ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                    : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f]"
                }`}
              >
                {dash}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="block space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#1d1d1f]">Opacity</span>
          <span className="text-[#86868b]">{Math.round(style.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={style.opacity}
          onPointerDown={onHistoryCheckpoint}
          onChange={(event) =>
            onChange({ opacity: Number(event.target.value) })
          }
          className="w-full accent-[#0071e3]"
        />
      </label>

      {showLineControls ? (
        <div className="space-y-3">
          <SectionTitle>Line caps & joins</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {(["round", "square"] as LineCapStyle[]).map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => onChange({ lineCap: cap })}
                className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize ${
                  style.lineCap === cap
                    ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                    : "border-black/[0.06] bg-[#f5f5f7]"
                }`}
              >
                {cap} cap
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["round", "miter"] as LineJoinStyle[]).map((join) => (
              <button
                key={join}
                type="button"
                onClick={() => onChange({ lineJoin: join })}
                className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize ${
                  style.lineJoin === join
                    ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                    : "border-black/[0.06] bg-[#f5f5f7]"
                }`}
              >
                {join} join
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showArrowControls ? (
        <div className="space-y-3">
          <SectionTitle>Arrow head</SectionTitle>
          <label className="block space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1d1d1f]">Size</span>
              <span className="text-[#86868b]">{style.arrowHeadSize}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              step={1}
              value={style.arrowHeadSize}
              onChange={(event) =>
                onChange({ arrowHeadSize: Number(event.target.value) })
              }
              className="w-full accent-[#0071e3]"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["filled", "open", "triangle"] as ArrowHeadStyle[]).map((head) => (
              <button
                key={head}
                type="button"
                onClick={() => onChange({ arrowHeadStyle: head })}
                className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize ${
                  style.arrowHeadStyle === head
                    ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                    : "border-black/[0.06] bg-[#f5f5f7]"
                }`}
              >
                {head}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#1d1d1f]">
            <input
              type="checkbox"
              checked={style.doubleHeaded}
              onChange={(event) =>
                onChange({ doubleHeaded: event.target.checked })
              }
            />
            Double-headed arrow
          </label>
        </div>
      ) : null}

      <div className="space-y-3">
        <SectionTitle>Shadow</SectionTitle>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={style.shadow.enabled}
            onChange={(event) => updateShadow({ enabled: event.target.checked })}
          />
          Enable shadow
        </label>
        {style.shadow.enabled ? (
          <>
            <label className="block space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Blur</span>
                <span>{style.shadow.blur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                value={style.shadow.blur}
                onChange={(event) =>
                  updateShadow({ blur: Number(event.target.value) })
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
            <label className="block space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Offset X</span>
                <span>{style.shadow.offsetX}px</span>
              </div>
              <input
                type="range"
                min={-32}
                max={32}
                value={style.shadow.offsetX}
                onChange={(event) =>
                  updateShadow({ offsetX: Number(event.target.value) })
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
            <label className="block space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Offset Y</span>
                <span>{style.shadow.offsetY}px</span>
              </div>
              <input
                type="range"
                min={-32}
                max={32}
                value={style.shadow.offsetY}
                onChange={(event) =>
                  updateShadow({ offsetY: Number(event.target.value) })
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Shadow color</span>
              <input
                type="color"
                value={style.shadow.color}
                onChange={(event) => updateShadow({ color: event.target.value })}
                className="h-8 w-12 cursor-pointer rounded border border-black/[0.08]"
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="space-y-3">
        <SectionTitle>Glow</SectionTitle>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={style.glow.enabled}
            onChange={(event) => updateGlow({ enabled: event.target.checked })}
          />
          Enable glow
        </label>
        {style.glow.enabled ? (
          <>
            <label className="block space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Intensity</span>
                <span>{Math.round(style.glow.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={style.glow.opacity}
                onChange={(event) =>
                  updateGlow({ opacity: Number(event.target.value) })
                }
                className="w-full accent-[#0071e3]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Glow color</span>
              <input
                type="color"
                value={style.glow.color}
                onChange={(event) => updateGlow({ color: event.target.value })}
                className="h-8 w-12 cursor-pointer rounded border border-black/[0.08]"
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
}

function editorToolToStyleContext(
  tool: import("@/types/konvaEditor").EditorToolId,
): AnnotationStylePanelContext | null {
  switch (tool) {
    case "line":
      return "line";
    case "arrow":
      return "arrow";
    case "freehand":
      return "freehand";
    case "highlighter":
      return "highlighter";
    case "label":
      return "callout";
    case "speech-bubble":
      return "callout";
    case "numbered-marker":
      return "marker";
    default:
      return null;
  }
}

export { editorToolToStyleContext };
