"use client";

import { SettingSection } from "@/components/ui/SettingSection";
import { BACKGROUND_GRADIENT_PRESETS } from "@/lib/konva/backgroundGradients";
import {
  getEffectiveImageCrop,
  isFullImageCrop,
} from "@/lib/konva/imageCrop";
import type {
  BackgroundFillType,
  EditorLayer,
  EditorLayerUpdate,
  ImageEditorLayer,
  ImageFilters,
  ImageMaskType,
  StageBackground,
} from "@/types/konvaEditor";
import {
  DEFAULT_IMAGE_FILTERS,
  DEFAULT_IMAGE_LAYER_STYLE,
} from "@/types/konvaEditor";

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

            {selectedLayer.type === "text" ? (
              <SettingSection title="Text" description="Edit label content and color">
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#1d1d1f]">
                      Content
                    </span>
                    <textarea
                      value={selectedLayer.text}
                      rows={3}
                      onFocus={onHistoryCheckpoint}
                      onChange={(event) =>
                        onUpdateLayer(
                          selectedLayer.id,
                          { text: event.target.value },
                          false,
                        )
                      }
                      className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
                    />
                  </label>
                  <RangeControl
                    label="Font size"
                    value={selectedLayer.fontSize}
                    min={12}
                    max={160}
                    step={1}
                    onChange={(fontSize) =>
                      onUpdateLayer(selectedLayer.id, { fontSize }, false)
                    }
                    onHistoryCheckpoint={onHistoryCheckpoint}
                  />
                  <ColorControl
                    label="Text color"
                    value={selectedLayer.fill}
                    onChange={(fill) =>
                      onUpdateLayer(selectedLayer.id, { fill })
                    }
                  />
                </div>
              </SettingSection>
            ) : null}

            {selectedLayer.type === "shape" ? (
              <SettingSection
                title="Shape"
                description="Fill and stroke for the selected shape"
              >
                <div className="space-y-3">
                  <ColorControl
                    label={
                      selectedLayer.shape === "line" ? "Line color" : "Fill color"
                    }
                    value={selectedLayer.fill}
                    onChange={(fill) =>
                      onUpdateLayer(selectedLayer.id, { fill })
                    }
                  />
                  {selectedLayer.shape === "line" ? (
                    <RangeControl
                      label="Stroke width"
                      value={selectedLayer.strokeWidth}
                      min={1}
                      max={24}
                      step={1}
                      onChange={(strokeWidth) =>
                        onUpdateLayer(selectedLayer.id, { strokeWidth }, false)
                      }
                      onHistoryCheckpoint={onHistoryCheckpoint}
                    />
                  ) : null}
                </div>
              </SettingSection>
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
