"use client";

import { TemplateGallery } from "@/components/advanced/TemplateGallery";

interface EditorEmptyStateProps {
  onSelectTemplate: (templateId: string) => void;
  onUploadClick: () => void;
}

export function EditorEmptyState({
  onSelectTemplate,
  onUploadClick,
}: EditorEmptyStateProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/70 px-6 py-8 text-center sm:py-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f7]">
          <svg
            className="h-6 w-6 text-[#86868b]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
            />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#1d1d1f]">
          Start with a template
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#86868b]">
          Pick a preset below, upload images, then try quick layouts after you
          add multiple photos.
        </p>
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-5 inline-flex rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ed]"
        >
          Upload images
        </button>
      </div>

      <TemplateGallery compact onSelectTemplate={onSelectTemplate} />
    </div>
  );
}
