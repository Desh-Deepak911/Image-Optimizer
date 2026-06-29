"use client";

import { SettingSection } from "@/components/ui/SettingSection";
import { BACKGROUND_GRADIENT_PRESETS } from "@/lib/konva/backgroundGradients";
import {
  getEffectiveImageCrop,
  isFullImageCrop,
} from "@/lib/konva/imageCrop";
import type {
  BackgroundFillType,
  CalloutEditorLayer,
  EditorLayer,
  EditorLayerUpdate,
  ImageEditorLayer,
  ImageFilters,
  ImageMaskType,
  ShapeEditorLayer,
  StageBackground,
  TextAlign,
  TextEditorLayer,
  TextFontStyle,
} from "@/types/konvaEditor";
import {
  DEFAULT_IMAGE_FILTERS,
  DEFAULT_IMAGE_LAYER_STYLE,
  DEFAULT_TEXT_FONT_FAMILY,
  isCoverPatchLayer,
  isVectorShape,
  TEXT_FONT_FAMILY_OPTIONS,
} from "@/types/konvaEditor";
import { getStrokeColor } from "@/lib/konva/annotationTools";

interface EditorControlsPanelProps {
  selectedLayer: EditorLayer | null;
  background: StageBackground;
  cropEditingLayerId?: string | null;
  onUpdateLayer: (
    layerId: string,
    update: EditorLayerUpdate,
    recordHistory?: boolean,
  ) => void;
  onUpdateBackground: (update: Partial<StageBackground>) => void;
  onHistoryCheckpoint: () => void;
  onStartCropEdit?: (layerId: string) => void;
  onFinishCropEdit?: () => void;
  onResetCrop?: (layerId: string) => void;
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onHistoryCheckpoint,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onHistoryCheckpoint: () => void;
  formatValue?: (value: number) => string;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#1d1d1f]">{label}</span>
        <span className="text-[#86868b]">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onHistoryCheckpoint}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#0071e3]"
      />
    </label>
  );
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#1d1d1f]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-black/20 accent-[#0071e3]"
      />
    </label>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#1d1d1f]">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-14 cursor-pointer rounded-md border border-black/[0.08] bg-white p-1"
      />
    </label>
  );
}

function ImageStyleControls({
  layerId,
  style,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layerId: string;
  style: typeof DEFAULT_IMAGE_LAYER_STYLE;
  onUpdateLayer: (
    layerId: string,
    update: EditorLayerUpdate,
    recordHistory?: boolean,
  ) => void;
  onHistoryCheckpoint: () => void;
}) {
  const updateStyle = (
    update: Partial<typeof DEFAULT_IMAGE_LAYER_STYLE>,
    recordHistory = false,
  ) => {
    onUpdateLayer(layerId, { style: update }, recordHistory);
  };

  const showCornerRadius =
    style.mask === "none" || style.mask === "rounded";

  return (
    <SettingSection
      title="Image styling"
      description="Rounded corners, border, shadow, and glow"
    >
      <div className="space-y-4">
        {showCornerRadius ? (
          <RangeControl
            label="Corner radius"
            value={style.cornerRadius}
            min={0}
            max={120}
            step={1}
            onChange={(cornerRadius) => updateStyle({ cornerRadius }, false)}
            onHistoryCheckpoint={onHistoryCheckpoint}
          />
        ) : null}
        <RangeControl
          label="Border width"
          value={style.borderWidth}
          min={0}
          max={24}
          step={1}
          onChange={(borderWidth) => updateStyle({ borderWidth }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        {style.borderWidth > 0 ? (
          <ColorControl
            label="Border color"
            value={style.borderColor}
            onChange={(borderColor) => updateStyle({ borderColor })}
          />
        ) : null}
        <RangeControl
          label="Shadow blur"
          value={style.shadowBlur}
          min={0}
          max={48}
          step={1}
          onChange={(shadowBlur) => updateStyle({ shadowBlur }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        {style.shadowBlur > 0 ? (
          <>
            <RangeControl
              label="Shadow offset"
              value={style.shadowOffsetY}
              min={0}
              max={32}
              step={1}
              onChange={(shadowOffsetY) => updateStyle({ shadowOffsetY }, false)}
              onHistoryCheckpoint={onHistoryCheckpoint}
            />
            <ColorControl
              label="Shadow color"
              value={style.shadowColor}
              onChange={(shadowColor) => updateStyle({ shadowColor })}
            />
          </>
        ) : null}
        <RangeControl
          label="Glow blur"
          value={style.glowBlur}
          min={0}
          max={64}
          step={1}
          onChange={(glowBlur) => updateStyle({ glowBlur }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        {style.glowBlur > 0 ? (
          <>
            <RangeControl
              label="Glow intensity"
              value={style.glowOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(glowOpacity) => updateStyle({ glowOpacity }, false)}
              onHistoryCheckpoint={onHistoryCheckpoint}
              formatValue={(value) => `${Math.round(value * 100)}%`}
            />
            <ColorControl
              label="Glow color"
              value={style.glowColor}
              onChange={(glowColor) => updateStyle({ glowColor })}
            />
          </>
        ) : null}
      </div>
    </SettingSection>
  );
}

const IMAGE_MASK_OPTIONS: { id: ImageMaskType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "rectangle", label: "Rectangle" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
];

function ImageMaskControls({
  layerId,
  style,
  onUpdateLayer,
}: {
  layerId: string;
  style: typeof DEFAULT_IMAGE_LAYER_STYLE;
  onUpdateLayer: (
    layerId: string,
    update: EditorLayerUpdate,
    recordHistory?: boolean,
  ) => void;
}) {
  return (
    <SettingSection
      title="Image mask"
      description="Clip the image to a shape"
    >
      <div className="grid grid-cols-2 gap-2">
        {IMAGE_MASK_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              onUpdateLayer(layerId, { style: { mask: option.id } })
            }
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              style.mask === option.id
                ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f] hover:border-[#0071e3]/30"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </SettingSection>
  );
}

function VectorShapeControls({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layer: ShapeEditorLayer;
  onUpdateLayer: EditorControlsPanelProps["onUpdateLayer"];
  onHistoryCheckpoint: () => void;
}) {
  const strokeColor = getStrokeColor(layer);

  return (
    <SettingSection
      title={
        layer.shape === "arrow"
          ? "Arrow"
          : layer.shape === "line"
            ? "Line"
            : layer.shape === "highlighter"
              ? "Highlight"
              : "Drawing"
      }
      description="Stroke, opacity, and style for the selected annotation"
    >
      <div className="space-y-3">
        <ColorControl
          label={layer.shape === "highlighter" ? "Highlight color" : "Stroke color"}
          value={layer.shape === "highlighter" ? layer.fill : strokeColor}
          onChange={(color) =>
            onUpdateLayer(
              layer.id,
              layer.shape === "highlighter"
                ? { fill: color, strokeColor: color }
                : { strokeColor: color, fill: color },
            )
          }
        />
        <RangeControl
          label="Stroke width"
          value={layer.strokeWidth}
          min={1}
          max={48}
          step={1}
          onChange={(strokeWidth) =>
            onUpdateLayer(layer.id, { strokeWidth }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        <RangeControl
          label="Opacity"
          value={layer.opacity}
          min={0.05}
          max={1}
          step={0.01}
          onChange={(opacity) => onUpdateLayer(layer.id, { opacity }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
        {layer.shape === "line" || layer.shape === "arrow" ? (
          <ToggleControl
            label="Dashed stroke"
            checked={layer.dashed ?? false}
            onChange={(dashed) => onUpdateLayer(layer.id, { dashed })}
          />
        ) : null}
        {layer.shape === "arrow" ? (
          <RangeControl
            label="Arrow head size"
            value={layer.arrowHeadSize ?? 14}
            min={8}
            max={32}
            step={1}
            onChange={(arrowHeadSize) =>
              onUpdateLayer(layer.id, { arrowHeadSize }, false)
            }
            onHistoryCheckpoint={onHistoryCheckpoint}
          />
        ) : null}
        {layer.shape === "freehand" || layer.shape === "highlighter" ? (
          <RangeControl
            label="Smoothing"
            value={layer.tension ?? 0.45}
            min={0}
            max={1}
            step={0.05}
            onChange={(tension) => onUpdateLayer(layer.id, { tension }, false)}
            onHistoryCheckpoint={onHistoryCheckpoint}
          />
        ) : null}
      </div>
    </SettingSection>
  );
}

function CalloutControls({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layer: CalloutEditorLayer;
  onUpdateLayer: EditorControlsPanelProps["onUpdateLayer"];
  onHistoryCheckpoint: () => void;
}) {
  return (
    <SettingSection
      title="Callout"
      description="Edit annotation text and colors"
    >
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#1d1d1f]">Text</span>
          <textarea
            value={layer.text}
            rows={3}
            onFocus={onHistoryCheckpoint}
            onChange={(event) =>
              onUpdateLayer(layer.id, { text: event.target.value }, false)
            }
            className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
          />
        </label>
        <ColorControl
          label="Fill color"
          value={layer.fill}
          onChange={(fill) => onUpdateLayer(layer.id, { fill })}
        />
        <ColorControl
          label="Text color"
          value={layer.textColor}
          onChange={(textColor) => onUpdateLayer(layer.id, { textColor })}
        />
        {layer.calloutType !== "numbered-marker" ? (
          <RangeControl
            label="Font size"
            value={layer.fontSize}
            min={10}
            max={48}
            step={1}
            onChange={(fontSize) =>
              onUpdateLayer(layer.id, { fontSize }, false)
            }
            onHistoryCheckpoint={onHistoryCheckpoint}
          />
        ) : null}
      </div>
    </SettingSection>
  );
}

function ShapeStyleControls({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layer: ShapeEditorLayer;
  onUpdateLayer: EditorControlsPanelProps["onUpdateLayer"];
  onHistoryCheckpoint: () => void;
}) {
  return (
    <SettingSection
      title="Shape"
      description="Fill, stroke, corners, and shadow"
    >
      <div className="space-y-3">
        <ColorControl
          label="Fill color"
          value={layer.fill}
          onChange={(fill) => onUpdateLayer(layer.id, { fill })}
        />
        <ColorControl
          label="Stroke color"
          value={layer.strokeColor ?? "#1d1d1f"}
          onChange={(strokeColor) => onUpdateLayer(layer.id, { strokeColor })}
        />
        <RangeControl
          label="Stroke width"
          value={layer.strokeWidth}
          min={0}
          max={24}
          step={1}
          onChange={(strokeWidth) =>
            onUpdateLayer(layer.id, { strokeWidth }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        {layer.shape === "rectangle" ? (
          <RangeControl
            label="Corner radius"
            value={layer.cornerRadius ?? 0}
            min={0}
            max={120}
            step={1}
            onChange={(cornerRadius) =>
              onUpdateLayer(layer.id, { cornerRadius }, false)
            }
            onHistoryCheckpoint={onHistoryCheckpoint}
          />
        ) : null}
        <RangeControl
          label="Shadow blur"
          value={layer.shadowBlur ?? 0}
          min={0}
          max={48}
          step={1}
          onChange={(shadowBlur) =>
            onUpdateLayer(layer.id, { shadowBlur }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        {(layer.shadowBlur ?? 0) > 0 ? (
          <>
            <RangeControl
              label="Shadow offset"
              value={layer.shadowOffsetY ?? 0}
              min={0}
              max={32}
              step={1}
              onChange={(shadowOffsetY) =>
                onUpdateLayer(layer.id, { shadowOffsetY }, false)
              }
              onHistoryCheckpoint={onHistoryCheckpoint}
            />
            <ColorControl
              label="Shadow color"
              value={layer.shadowColor ?? "#000000"}
              onChange={(shadowColor) =>
                onUpdateLayer(layer.id, { shadowColor })
              }
            />
          </>
        ) : null}
      </div>
    </SettingSection>
  );
}

function CoverPatchControls({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layer: ShapeEditorLayer;
  onUpdateLayer: EditorControlsPanelProps["onUpdateLayer"];
  onHistoryCheckpoint: () => void;
}) {
  return (
    <SettingSection
      title="Cover patch"
      description="Adjust fill, opacity, corners, and shadow"
    >
      <div className="space-y-3">
        <ColorControl
          label="Fill color"
          value={layer.fill}
          onChange={(fill) => onUpdateLayer(layer.id, { fill })}
        />
        <RangeControl
          label="Corner radius"
          value={layer.cornerRadius ?? 0}
          min={0}
          max={64}
          step={1}
          onChange={(cornerRadius) =>
            onUpdateLayer(layer.id, { cornerRadius }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        <RangeControl
          label="Shadow blur"
          value={layer.shadowBlur ?? 0}
          min={0}
          max={48}
          step={1}
          onChange={(shadowBlur) =>
            onUpdateLayer(layer.id, { shadowBlur }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        <RangeControl
          label="Shadow offset"
          value={layer.shadowOffsetY ?? 0}
          min={0}
          max={32}
          step={1}
          onChange={(shadowOffsetY) =>
            onUpdateLayer(layer.id, { shadowOffsetY }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        <RangeControl
          label="Shadow opacity"
          value={layer.shadowOpacity ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(shadowOpacity) =>
            onUpdateLayer(layer.id, { shadowOpacity }, false)
          }
          onHistoryCheckpoint={onHistoryCheckpoint}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
      </div>
    </SettingSection>
  );
}

function LayerTransformControls({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layer: EditorLayer;
  onUpdateLayer: EditorControlsPanelProps["onUpdateLayer"];
  onHistoryCheckpoint: () => void;
}) {
  const updateTransform = (
    update: EditorLayerUpdate,
    recordHistory = false,
  ) => {
    onUpdateLayer(layer.id, update, recordHistory);
  };

  return (
    <SettingSection
      title="Transform"
      description="Position, size, and rotation for the selected layer"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#1d1d1f]">X</span>
            <input
              type="number"
              value={Math.round(layer.x)}
              step={1}
              onFocus={onHistoryCheckpoint}
              onChange={(event) =>
                updateTransform({ x: Number(event.target.value) }, false)
              }
              className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm tabular-nums text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#1d1d1f]">Y</span>
            <input
              type="number"
              value={Math.round(layer.y)}
              step={1}
              onFocus={onHistoryCheckpoint}
              onChange={(event) =>
                updateTransform({ y: Number(event.target.value) }, false)
              }
              className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm tabular-nums text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#1d1d1f]">Width</span>
            <input
              type="number"
              min={layer.type === "text" ? 40 : 20}
              value={Math.round(layer.width)}
              step={1}
              onFocus={onHistoryCheckpoint}
              onChange={(event) =>
                updateTransform(
                  { width: Math.max(20, Number(event.target.value)) },
                  false,
                )
              }
              className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm tabular-nums text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
            />
          </label>
          {layer.type !== "text" ? (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#1d1d1f]">Height</span>
              <input
                type="number"
                min={20}
                value={Math.round(layer.height)}
                step={1}
                onFocus={onHistoryCheckpoint}
                onChange={(event) =>
                  updateTransform(
                    { height: Math.max(20, Number(event.target.value)) },
                    false,
                  )
                }
                className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm tabular-nums text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
              />
            </label>
          ) : (
            <RangeControl
              label="Font size"
              value={layer.fontSize}
              min={12}
              max={160}
              step={1}
              onChange={(fontSize) => updateTransform({ fontSize }, false)}
              onHistoryCheckpoint={onHistoryCheckpoint}
            />
          )}
        </div>

        <RangeControl
          label="Rotation"
          value={layer.rotation}
          min={-180}
          max={180}
          step={1}
          onChange={(rotation) => updateTransform({ rotation }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
          formatValue={(value) => `${Math.round(value)}°`}
        />
      </div>
    </SettingSection>
  );
}

function TextStyleControls({
  layer,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layer: TextEditorLayer;
  onUpdateLayer: EditorControlsPanelProps["onUpdateLayer"];
  onHistoryCheckpoint: () => void;
}) {
  const setFontStyle = (nextStyle: TextFontStyle) => {
    onUpdateLayer(layer.id, { fontStyle: nextStyle });
  };

  const isBold =
    layer.fontStyle === "bold" || layer.fontStyle === "bold italic";
  const isItalic =
    layer.fontStyle === "italic" || layer.fontStyle === "bold italic";

  const toggleBold = () => {
    const nextBold = !isBold;
    const nextStyle: TextFontStyle =
      nextBold && isItalic
        ? "bold italic"
        : nextBold
          ? "bold"
          : isItalic
            ? "italic"
            : "normal";
    setFontStyle(nextStyle);
  };

  const toggleItalic = () => {
    const nextItalic = !isItalic;
    const nextStyle: TextFontStyle =
      isBold && nextItalic
        ? "bold italic"
        : isBold
          ? "bold"
          : nextItalic
            ? "italic"
            : "normal";
    setFontStyle(nextStyle);
  };

  return (
    <SettingSection title="Text" description="Edit content, typography, and color">
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#1d1d1f]">Content</span>
          <textarea
            value={layer.text}
            rows={4}
            onFocus={onHistoryCheckpoint}
            onChange={(event) =>
              onUpdateLayer(layer.id, { text: event.target.value }, false)
            }
            className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
          />
        </label>

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

        <ColorControl
          label="Text color"
          value={layer.fill}
          onChange={(fill) => onUpdateLayer(layer.id, { fill })}
        />
      </div>
    </SettingSection>
  );
}

function ImageCropControls({
  layer,
  isEditing,
  onStartCropEdit,
  onFinishCropEdit,
  onResetCrop,
}: {
  layer: ImageEditorLayer;
  isEditing: boolean;
  onStartCropEdit?: (layerId: string) => void;
  onFinishCropEdit?: () => void;
  onResetCrop?: (layerId: string) => void;
}) {
  const crop = getEffectiveImageCrop(
    layer.crop,
    layer.image.width,
    layer.image.height,
  );
  const hasCustomCrop = !isFullImageCrop(
    crop,
    layer.image.width,
    layer.image.height,
  );

  return (
    <SettingSection
      title="Crop"
      description="Trim the source image region shown in this layer"
    >
      <div className="space-y-3">
        {isEditing ? (
          <p className="rounded-lg bg-[#0071e3]/[0.08] px-3 py-2 text-xs text-[#0071e3]">
            Drag the image to reposition the crop, or pull the corner handles
            to resize it.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
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
              onClick={() => onStartCropEdit?.(layer.id)}
              className="rounded-lg border border-black/[0.06] bg-[#f5f5f7] px-3 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06]"
            >
              Crop image
            </button>
          )}
          <button
            type="button"
            disabled={!hasCustomCrop}
            onClick={() => onResetCrop?.(layer.id)}
            className="rounded-lg border border-black/[0.06] bg-[#f5f5f7] px-3 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset crop
          </button>
        </div>
      </div>
    </SettingSection>
  );
}

function BackgroundControls({
  background,
  onUpdateBackground,
  onHistoryCheckpoint,
}: {
  background: StageBackground;
  onUpdateBackground: (update: Partial<StageBackground>) => void;
  onHistoryCheckpoint: () => void;
}) {
  const fillType = background.fillType ?? "solid";

  const setFillType = (nextFillType: BackgroundFillType) => {
    onUpdateBackground({
      fillType: nextFillType,
      transparent: false,
    });
  };

  return (
    <SettingSection
      title="Background"
      description="Canvas fill behind all layers"
    >
      <div className="space-y-4">
        <ToggleControl
          label="Transparent background"
          checked={background.transparent}
          onChange={(transparent) => onUpdateBackground({ transparent })}
        />

        {!background.transparent ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {(["solid", "linear", "radial"] as BackgroundFillType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFillType(type)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                      fillType === type
                        ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
                        : "border-black/[0.06] bg-[#f5f5f7] text-[#1d1d1f] hover:border-[#0071e3]/30"
                    }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>

            {fillType === "solid" ? (
              <ColorControl
                label="Background color"
                value={background.color}
                onChange={(color) => onUpdateBackground({ color })}
              />
            ) : null}

            {fillType === "linear" ? (
              <>
                <RangeControl
                  label="Gradient angle"
                  value={background.gradientAngle ?? 180}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(gradientAngle) =>
                    onUpdateBackground({ gradientAngle })
                  }
                  onHistoryCheckpoint={onHistoryCheckpoint}
                  formatValue={(value) => `${value}°`}
                />
                <ColorControl
                  label="Start color"
                  value={background.gradientStops?.[0]?.color ?? background.color}
                  onChange={(color) =>
                    onUpdateBackground({
                      gradientStops: [
                        { offset: 0, color },
                        background.gradientStops?.[1] ?? {
                          offset: 1,
                          color: background.color,
                        },
                      ],
                    })
                  }
                />
                <ColorControl
                  label="End color"
                  value={
                    background.gradientStops?.[1]?.color ?? background.color
                  }
                  onChange={(color) =>
                    onUpdateBackground({
                      gradientStops: [
                        background.gradientStops?.[0] ?? {
                          offset: 0,
                          color: background.color,
                        },
                        { offset: 1, color },
                      ],
                    })
                  }
                />
              </>
            ) : null}

            {fillType === "radial" ? (
              <>
                <ColorControl
                  label="Inner color"
                  value={background.gradientStops?.[0]?.color ?? background.color}
                  onChange={(color) =>
                    onUpdateBackground({
                      gradientStops: [
                        { offset: 0, color },
                        background.gradientStops?.[1] ?? {
                          offset: 1,
                          color: background.color,
                        },
                      ],
                    })
                  }
                />
                <ColorControl
                  label="Outer color"
                  value={
                    background.gradientStops?.[1]?.color ?? background.color
                  }
                  onChange={(color) =>
                    onUpdateBackground({
                      gradientStops: [
                        background.gradientStops?.[0] ?? {
                          offset: 0,
                          color: background.color,
                        },
                        { offset: 1, color },
                      ],
                    })
                  }
                />
              </>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-medium text-[#1d1d1f]">
                Preset gradients
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onUpdateBackground({
                        transparent: false,
                        ...preset.background,
                      })
                    }
                    className="rounded-lg border border-black/[0.06] px-2 py-2 text-left text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SettingSection>
  );
}

function ImageFilterControls({
  layerId,
  filters,
  onUpdateLayer,
  onHistoryCheckpoint,
}: {
  layerId: string;
  filters: ImageFilters;
  onUpdateLayer: (
    layerId: string,
    update: EditorLayerUpdate,
    recordHistory?: boolean,
  ) => void;
  onHistoryCheckpoint: () => void;
}) {
  const updateFilters = (update: Partial<ImageFilters>, recordHistory = false) => {
    onUpdateLayer(layerId, { filters: update }, recordHistory);
  };

  return (
    <SettingSection
      title="Image filters"
      description="Adjust tone and effects for the selected image"
    >
      <div className="space-y-4">
        <RangeControl
          label="Brightness"
          value={filters.brightness}
          min={-1}
          max={1}
          step={0.05}
          onChange={(value) => updateFilters({ brightness: value }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
        <RangeControl
          label="Contrast"
          value={filters.contrast}
          min={-100}
          max={100}
          step={1}
          onChange={(value) => updateFilters({ contrast: value }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        <RangeControl
          label="Saturation"
          value={filters.saturation}
          min={-1}
          max={1}
          step={0.05}
          onChange={(value) => updateFilters({ saturation: value }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
        <RangeControl
          label="Blur"
          value={filters.blur}
          min={0}
          max={20}
          step={1}
          onChange={(value) => updateFilters({ blur: value }, false)}
          onHistoryCheckpoint={onHistoryCheckpoint}
        />
        <ToggleControl
          label="Grayscale"
          checked={filters.grayscale}
          onChange={(checked) => updateFilters({ grayscale: checked })}
        />
        <ToggleControl
          label="Sepia"
          checked={filters.sepia}
          onChange={(checked) => updateFilters({ sepia: checked })}
        />
        <button
          type="button"
          onClick={() =>
            onUpdateLayer(layerId, { filters: { ...DEFAULT_IMAGE_FILTERS } })
          }
          className="text-xs font-medium text-[#0071e3] hover:underline"
        >
          Reset filters
        </button>
      </div>
    </SettingSection>
  );
}

export function EditorControlsPanel({
  selectedLayer,
  background,
  cropEditingLayerId = null,
  onUpdateLayer,
  onUpdateBackground,
  onHistoryCheckpoint,
  onStartCropEdit,
  onFinishCropEdit,
  onResetCrop,
}: EditorControlsPanelProps) {
  return (
    <aside className="flex flex-col rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.04] px-4 py-4">
        <h2 className="text-base font-semibold text-[#1d1d1f]">Edit controls</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Background and selected layer properties
        </p>
      </div>

      <div className="max-h-[32rem] space-y-6 overflow-y-auto px-4 py-5">
        <BackgroundControls
          background={background}
          onUpdateBackground={onUpdateBackground}
          onHistoryCheckpoint={onHistoryCheckpoint}
        />

        {selectedLayer ? (
          <>
            <SettingSection
              title="Layer opacity"
              description={`Adjust opacity for ${selectedLayer.name}`}
            >
              <RangeControl
                label="Opacity"
                value={selectedLayer.opacity}
                min={0}
                max={1}
                step={0.01}
                onChange={(opacity) =>
                  onUpdateLayer(selectedLayer.id, { opacity }, false)
                }
                onHistoryCheckpoint={onHistoryCheckpoint}
                formatValue={(value) => `${Math.round(value * 100)}%`}
              />
            </SettingSection>

            <LayerTransformControls
              layer={selectedLayer}
              onUpdateLayer={onUpdateLayer}
              onHistoryCheckpoint={onHistoryCheckpoint}
            />

            {selectedLayer.type === "text" ? (
              <TextStyleControls
                layer={selectedLayer}
                onUpdateLayer={onUpdateLayer}
                onHistoryCheckpoint={onHistoryCheckpoint}
              />
            ) : null}

            {selectedLayer.type === "callout" ? (
              <CalloutControls
                layer={selectedLayer}
                onUpdateLayer={onUpdateLayer}
                onHistoryCheckpoint={onHistoryCheckpoint}
              />
            ) : null}

            {selectedLayer.type === "shape" ? (
              <>
                {isVectorShape(selectedLayer) ? (
                  <VectorShapeControls
                    layer={selectedLayer}
                    onUpdateLayer={onUpdateLayer}
                    onHistoryCheckpoint={onHistoryCheckpoint}
                  />
                ) : isCoverPatchLayer(selectedLayer) ? (
                  <CoverPatchControls
                    layer={selectedLayer}
                    onUpdateLayer={onUpdateLayer}
                    onHistoryCheckpoint={onHistoryCheckpoint}
                  />
                ) : (
                  <ShapeStyleControls
                    layer={selectedLayer}
                    onUpdateLayer={onUpdateLayer}
                    onHistoryCheckpoint={onHistoryCheckpoint}
                  />
                )}
              </>
            ) : null}

            {selectedLayer.type === "image" ? (
              (() => {
                const imageStyle = {
                  ...DEFAULT_IMAGE_LAYER_STYLE,
                  ...selectedLayer.style,
                };

                return (
                  <>
                    <ImageCropControls
                      layer={selectedLayer}
                      isEditing={cropEditingLayerId === selectedLayer.id}
                      onStartCropEdit={onStartCropEdit}
                      onFinishCropEdit={onFinishCropEdit}
                      onResetCrop={onResetCrop}
                    />
                    <ImageMaskControls
                      layerId={selectedLayer.id}
                      style={imageStyle}
                      onUpdateLayer={onUpdateLayer}
                    />
                    <ImageStyleControls
                      layerId={selectedLayer.id}
                      style={imageStyle}
                      onUpdateLayer={onUpdateLayer}
                      onHistoryCheckpoint={onHistoryCheckpoint}
                    />
                    <ImageFilterControls
                      layerId={selectedLayer.id}
                      filters={selectedLayer.filters}
                      onUpdateLayer={onUpdateLayer}
                      onHistoryCheckpoint={onHistoryCheckpoint}
                    />
                  </>
                );
              })()
            ) : null}
          </>
        ) : (
          <p className="rounded-xl bg-[#f5f5f7] px-3 py-4 text-sm text-[#86868b]">
            Select a layer on the canvas or in the layer panel to edit its
            properties.
          </p>
        )}
      </div>
    </aside>
  );
}
