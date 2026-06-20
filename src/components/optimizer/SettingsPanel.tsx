"use client";

import type { CSSProperties } from "react";
import { OptionPicker } from "@/components/ui/OptionPicker";
import { SettingSection } from "@/components/ui/SettingSection";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingsEmptyState } from "@/components/optimizer/SettingsEmptyState";
import { getExportDimensionsFromSettings } from "@/lib/imageExport";
import {
  ASPECT_RATIO_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  FIT_MODE_OPTIONS,
} from "@/lib/constants";
import { OUTPUT_WIDTH_OPTIONS, resolveOutputWidth } from "@/lib/outputSize";
import type { OptimizerSettings, UploadedImage } from "@/types/optimizer";
import {
  MAX_EXPORT_QUALITY,
  MAX_OUTPUT_WIDTH,
  MIN_EXPORT_QUALITY,
  MIN_OUTPUT_WIDTH,
} from "@/types/optimizer";

interface SettingsPanelProps {
  settings: OptimizerSettings;
  image: UploadedImage | null;
  onSettingChange: <K extends keyof OptimizerSettings>(
    key: K,
    value: OptimizerSettings[K],
  ) => void;
  disabled?: boolean;
}

export function SettingsPanel({
  settings,
  image,
  onSettingChange,
  disabled = false,
}: SettingsPanelProps) {
  const showQuality =
    settings.exportFormat === "jpeg" || settings.exportFormat === "webp";
  const outputWidth = resolveOutputWidth(
    settings.outputWidthPreset,
    settings.customOutputWidth,
  );
  const outputDimensions = image
    ? getExportDimensionsFromSettings(settings, image)
    : null;

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.04] px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-[#1d1d1f]">Export settings</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Adjust framing and output options
        </p>
      </div>

      {disabled ? (
        <div className="px-4 py-5 sm:px-5">
          <SettingsEmptyState />
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          <SettingSection
            title="Aspect ratio"
            description="Choose a preset for social, video, or custom framing"
          >
            <OptionPicker
              label="Aspect ratio"
              value={settings.aspectRatio}
              options={ASPECT_RATIO_OPTIONS}
              onChange={(value) => onSettingChange("aspectRatio", value)}
              layout="list"
            />
          </SettingSection>

          <SettingSection
            title="Fit mode"
            description="Decide how your screenshot fills the export frame"
          >
            <OptionPicker
              label="Fit mode"
              value={settings.fitMode}
              options={FIT_MODE_OPTIONS}
              onChange={(value) => onSettingChange("fitMode", value)}
              layout="list"
              showSelectedHelper
            />
          </SettingSection>

          <div className="border-t border-black/[0.04] pt-6">
            <SettingSection
              title="Output size"
              description="Export width in pixels — height follows the aspect ratio"
            >
              <div className="space-y-3">
                <SegmentedControl
                  label="Output width"
                  value={settings.outputWidthPreset}
                  options={OUTPUT_WIDTH_OPTIONS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  onChange={(value) =>
                    onSettingChange("outputWidthPreset", value)
                  }
                  columns={2}
                />

                {settings.outputWidthPreset === "custom" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="custom-output-width"
                      className="text-sm text-[#6e6e73]"
                    >
                      Custom width
                    </label>
                    <input
                      id="custom-output-width"
                      type="number"
                      min={MIN_OUTPUT_WIDTH}
                      max={MAX_OUTPUT_WIDTH}
                      step={1}
                      value={settings.customOutputWidth}
                      onChange={(event) =>
                        onSettingChange(
                          "customOutputWidth",
                          Number(event.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-2.5 text-sm font-medium tabular-nums text-[#1d1d1f] outline-none transition-colors focus:border-[#0071e3] focus:bg-white"
                    />
                    <p className="text-xs text-[#86868b]">
                      Between {MIN_OUTPUT_WIDTH.toLocaleString()} and{" "}
                      {MAX_OUTPUT_WIDTH.toLocaleString()} px
                    </p>
                  </div>
                ) : null}

                {outputDimensions ? (
                  <p className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs text-[#6e6e73]">
                    Export canvas:{" "}
                    <span className="font-medium tabular-nums text-[#1d1d1f]">
                      {outputDimensions.width} × {outputDimensions.height}px
                    </span>{" "}
                    at {outputWidth}px width
                  </p>
                ) : null}
              </div>
            </SettingSection>
          </div>

          <SettingSection
            title="Export format"
            description="Choose the output file type"
          >
            <SegmentedControl
              label="Export format"
              value={settings.exportFormat}
              options={EXPORT_FORMAT_OPTIONS.map(({ value, label }) => ({
                value,
                label,
              }))}
              onChange={(value) => onSettingChange("exportFormat", value)}
              columns={3}
            />
          </SettingSection>

          {showQuality ? (
            <SettingSection
              title="Quality"
              description={`Compression level for ${settings.exportFormat.toUpperCase()}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6e6e73]">Output quality</span>
                  <span className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-sm font-medium tabular-nums text-[#1d1d1f]">
                    {settings.quality}%
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_EXPORT_QUALITY}
                  max={MAX_EXPORT_QUALITY}
                  step={1}
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
                  aria-label="Export quality"
                />
                <div className="flex justify-between text-xs text-[#86868b]">
                  <span>{MIN_EXPORT_QUALITY}% smaller file</span>
                  <span>{MAX_EXPORT_QUALITY}% best quality</span>
                </div>
              </div>
            </SettingSection>
          ) : null}
        </div>
      )}
    </aside>
  );
}
