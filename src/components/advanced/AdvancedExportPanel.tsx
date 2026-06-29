"use client";

import type { CSSProperties } from "react";
import { OptionPicker } from "@/components/ui/OptionPicker";
import { SettingSection } from "@/components/ui/SettingSection";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EXPORT_FORMAT_OPTIONS } from "@/lib/constants";
import { FIXED_DIMENSION_PRESETS } from "@/lib/konva/outputPresets";
import type {
  AdvancedEditorSettings,
  DimensionPreset,
  ExportDimensionPreset,
} from "@/types/konvaEditor";
import {
  MAX_EXPORT_QUALITY,
  MAX_OUTPUT_WIDTH,
  MIN_EXPORT_QUALITY,
  MIN_OUTPUT_WIDTH,
} from "@/types/optimizer";

interface AdvancedExportPanelProps {
  settings: AdvancedEditorSettings;
  canvasWidth: number;
  canvasHeight: number;
  exportWidth: number;
  exportHeight: number;
  onSettingChange: <K extends keyof AdvancedEditorSettings>(
    key: K,
    value: AdvancedEditorSettings[K],
  ) => void;
}

const CANVAS_PRESET_OPTIONS: {
  value: DimensionPreset;
  label: string;
  description: string;
}[] = [
  {
    value: "1080x1080",
    label: "Square",
    description: FIXED_DIMENSION_PRESETS["1080x1080"].label,
  },
  {
    value: "1080x1350",
    label: "Portrait",
    description: FIXED_DIMENSION_PRESETS["1080x1350"].label,
  },
  {
    value: "1080x1920",
    label: "Story",
    description: FIXED_DIMENSION_PRESETS["1080x1920"].label,
  },
  {
    value: "1920x1080",
    label: "Landscape",
    description: FIXED_DIMENSION_PRESETS["1920x1080"].label,
  },
  {
    value: "custom",
    label: "Custom",
    description: "Set your own canvas size",
  },
];

const EXPORT_PRESET_OPTIONS: {
  value: ExportDimensionPreset;
  label: string;
  description: string;
}[] = [
  {
    value: "canvas",
    label: "Canvas size",
    description: "Export at the current editor canvas dimensions",
  },
  ...CANVAS_PRESET_OPTIONS,
];

export function AdvancedExportPanel({
  settings,
  canvasWidth,
  canvasHeight,
  exportWidth,
  exportHeight,
  onSettingChange,
}: AdvancedExportPanelProps) {
  const showQuality =
    settings.exportFormat === "jpeg" || settings.exportFormat === "webp";

  return (
    <aside className="flex flex-col rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.04] px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-[#1d1d1f]">Canvas & export</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Set canvas size, output dimensions, and file format
        </p>
      </div>

      <div className="max-h-[28rem] space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          <SettingSection
            title="Canvas size"
            description={`Editing at ${canvasWidth} × ${canvasHeight}px`}
          >
            <OptionPicker
              label="Canvas size"
              value={settings.canvasPreset}
              options={CANVAS_PRESET_OPTIONS}
              onChange={(value) => onSettingChange("canvasPreset", value)}
              layout="grid"
            />

            {settings.canvasPreset === "custom" ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[#1d1d1f]">Width</span>
                  <input
                    type="number"
                    min={MIN_OUTPUT_WIDTH}
                    max={MAX_OUTPUT_WIDTH}
                    value={settings.customCanvasWidth}
                    onChange={(event) =>
                      onSettingChange(
                        "customCanvasWidth",
                        Number(event.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm outline-none focus:border-[#0071e3]/40"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[#1d1d1f]">Height</span>
                  <input
                    type="number"
                    min={MIN_OUTPUT_WIDTH}
                    max={MAX_OUTPUT_WIDTH}
                    value={settings.customCanvasHeight}
                    onChange={(event) =>
                      onSettingChange(
                        "customCanvasHeight",
                        Number(event.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm outline-none focus:border-[#0071e3]/40"
                  />
                </label>
              </div>
            ) : null}
          </SettingSection>

          <SettingSection
            title="Export size"
            description={`Output will be ${exportWidth} × ${exportHeight}px`}
          >
            <OptionPicker
              label="Export size"
              value={settings.exportPreset}
              options={EXPORT_PRESET_OPTIONS}
              onChange={(value) => onSettingChange("exportPreset", value)}
              layout="grid"
            />

            {settings.exportPreset === "custom" ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[#1d1d1f]">Width</span>
                  <input
                    type="number"
                    min={MIN_OUTPUT_WIDTH}
                    max={MAX_OUTPUT_WIDTH}
                    value={settings.customExportWidth}
                    onChange={(event) =>
                      onSettingChange(
                        "customExportWidth",
                        Number(event.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm outline-none focus:border-[#0071e3]/40"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[#1d1d1f]">Height</span>
                  <input
                    type="number"
                    min={MIN_OUTPUT_WIDTH}
                    max={MAX_OUTPUT_WIDTH}
                    value={settings.customExportHeight}
                    onChange={(event) =>
                      onSettingChange(
                        "customExportHeight",
                        Number(event.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm outline-none focus:border-[#0071e3]/40"
                  />
                </label>
              </div>
            ) : null}
          </SettingSection>

          <SettingSection title="Format" description="PNG, JPEG, or WebP download">
            <SegmentedControl
              label="Export format"
              value={settings.exportFormat}
              options={EXPORT_FORMAT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(value) => onSettingChange("exportFormat", value)}
            />
          </SettingSection>

          {showQuality ? (
            <SettingSection
              title="Quality"
              description="Higher quality means larger file size"
            >
              <label className="block space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1d1d1f]">Compression</span>
                  <span className="text-[#86868b]">{settings.quality}%</span>
                </div>
                <input
                  type="range"
                  min={MIN_EXPORT_QUALITY}
                  max={MAX_EXPORT_QUALITY}
                  value={settings.quality}
                  onChange={(event) =>
                    onSettingChange("quality", Number(event.target.value))
                  }
                  style={
                    {
                      "--value": `${((settings.quality - MIN_EXPORT_QUALITY) / (MAX_EXPORT_QUALITY - MIN_EXPORT_QUALITY)) * 100}%`,
                    } as CSSProperties
                  }
                  className="quality-slider w-full"
                />
              </label>
            </SettingSection>
          ) : null}
        </div>
    </aside>
  );
}
