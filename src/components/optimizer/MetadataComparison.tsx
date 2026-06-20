import { formatFileSize } from "@/lib/formatters";
import {
  calculateSizeDelta,
  estimateOutputFileSize,
} from "@/lib/estimateFileSize";
import { getExportDimensionsFromSettings } from "@/lib/imageExport";
import type { ExportSuccessState, OptimizerSettings, UploadedImage } from "@/types/optimizer";

interface MetadataComparisonProps {
  image: UploadedImage;
  settings: OptimizerSettings;
  exportSuccess: ExportSuccessState | null;
}

export function MetadataComparison({
  image,
  settings,
  exportSuccess,
}: MetadataComparisonProps) {
  const outputDimensions = getExportDimensionsFromSettings(settings, image);
  const estimatedOutputSize = estimateOutputFileSize(
    outputDimensions,
    settings.exportFormat,
    settings.quality,
  );
  const outputSize = exportSuccess?.size ?? estimatedOutputSize;
  const outputSizeLabel = exportSuccess ? "Exported size" : "Estimated size";
  const sizeDelta = calculateSizeDelta(image.size, outputSize);
  const outputWidth = exportSuccess?.width ?? outputDimensions.width;
  const outputHeight = exportSuccess?.height ?? outputDimensions.height;

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#1d1d1f]">
            Before & after
          </h2>
          <p className="mt-0.5 text-xs text-[#86868b]">
            Compare your original upload with the export preview
          </p>
        </div>
        {sizeDelta !== null ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              sizeDelta <= 0
                ? "bg-[#34c759]/10 text-[#248a3d]"
                : "bg-[#ff9500]/10 text-[#c93400]"
            }`}
          >
            {sizeDelta <= 0 ? "" : "+"}
            {sizeDelta}% file size
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <MetadataColumn
          label="Original"
          fileSize={formatFileSize(image.size)}
          dimensions={`${image.width} × ${image.height}px`}
          tone="muted"
        />

        <div className="hidden items-center justify-center sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7] text-[#86868b]">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </div>

        <MetadataColumn
          label="Output"
          fileSize={formatFileSize(outputSize)}
          fileSizeCaption={outputSizeLabel}
          dimensions={`${outputWidth} × ${outputHeight}px`}
          tone="accent"
        />
      </div>
    </section>
  );
}

interface MetadataColumnProps {
  label: string;
  fileSize: string;
  fileSizeCaption?: string;
  dimensions: string;
  tone: "muted" | "accent";
}

function MetadataColumn({
  label,
  fileSize,
  fileSizeCaption,
  dimensions,
  tone,
}: MetadataColumnProps) {
  const labelClass =
    tone === "accent" ? "text-[#0071e3]" : "text-[#86868b]";

  return (
    <div className="rounded-xl bg-[#f5f5f7] px-4 py-3.5">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${labelClass}`}>
        {label}
      </p>
      <dl className="mt-3 space-y-2.5">
        <div>
          <dt className="text-xs text-[#86868b]">File size</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#1d1d1f]">
            {fileSize}
          </dd>
          {fileSizeCaption ? (
            <dd className="mt-0.5 text-[11px] text-[#86868b]">
              {fileSizeCaption}
            </dd>
          ) : null}
        </div>
        <div>
          <dt className="text-xs text-[#86868b]">Dimensions</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#1d1d1f]">
            {dimensions}
          </dd>
        </div>
      </dl>
    </div>
  );
}
