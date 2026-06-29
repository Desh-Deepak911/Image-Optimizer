"use client";

import { EDITOR_TEMPLATES } from "@/lib/konva/editorTemplates";

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void;
  compact?: boolean;
}

export function TemplateGallery({
  onSelectTemplate,
  compact = false,
}: TemplateGalleryProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Template presets</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Start with a canvas size matched to your platform
        </p>
      </div>

      <div
        className={`mt-3 grid gap-2 ${
          compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {EDITOR_TEMPLATES.map((template) => {
          const isPortrait = template.height > template.width;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className="group flex flex-col items-start rounded-xl border border-black/[0.06] bg-[#f5f5f7] p-3 text-left transition-all hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06]"
            >
              <div className="mb-2 flex h-14 w-full items-center justify-center">
                <div
                  className="rounded-md border border-black/[0.08] bg-white shadow-sm transition-transform group-hover:scale-105"
                  style={{
                    width: isPortrait ? 28 : 48,
                    height: isPortrait ? 48 : 28,
                    backgroundColor: template.background.color,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-[#1d1d1f]">
                {template.name}
              </span>
              <span className="mt-0.5 text-[10px] text-[#86868b]">
                {template.width} × {template.height}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
