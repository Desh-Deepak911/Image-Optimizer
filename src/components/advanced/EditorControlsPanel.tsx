"use client";

import { SettingSection } from "@/components/ui/SettingSection";
import type {
  EditorLayer,
  EditorLayerUpdate,
  ImageFilters,
  StageBackground,
} from "@/types/konvaEditor";
import { DEFAULT_IMAGE_FILTERS } from "@/types/konvaEditor";

interface EditorControlsPanelProps {
  selectedLayer: EditorLayer | null;
  background: StageBackground;
  onUpdateLayer: (
    layerId: string,
    update: EditorLayerUpdate,
    recordHistory?: boolean,
  ) => void;
  onUpdateBackground: (update: Partial<StageBackground>) => void;
  onHistoryCheckpoint: () => void;
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
  onUpdateLayer,
  onUpdateBackground,
  onHistoryCheckpoint,
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
        <SettingSection
          title="Background"
          description="Canvas fill behind all layers"
        >
          <div className="space-y-3">
            <ToggleControl
              label="Transparent background"
              checked={background.transparent}
              onChange={(transparent) => onUpdateBackground({ transparent })}
            />
            {!background.transparent ? (
              <ColorControl
                label="Background color"
                value={background.color}
                onChange={(color) => onUpdateBackground({ color })}
              />
            ) : null}
          </div>
        </SettingSection>

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
              <ImageFilterControls
                layerId={selectedLayer.id}
                filters={selectedLayer.filters}
                onUpdateLayer={onUpdateLayer}
                onHistoryCheckpoint={onHistoryCheckpoint}
              />
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
