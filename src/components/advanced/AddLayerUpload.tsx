"use client";

import { useCallback, useRef } from "react";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_LABEL,
} from "@/lib/constants";
import { MAX_FILE_SIZE_BYTES } from "@/lib/imageValidation";
import { formatFileSize } from "@/lib/formatters";

interface AddLayerUploadProps {
  onFileSelect: (file: File) => void;
  layerCount: number;
}

export function AddLayerUpload({ onFileSelect, layerCount }: AddLayerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) {
        return;
      }

      Array.from(files).forEach((file) => {
        onFileSelect(file);
      });

      event.target.value = "";
    },
    [onFileSelect],
  );

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1d1d1f]">
            {layerCount === 0 ? "Add your first layer" : `${layerCount} layer${layerCount === 1 ? "" : "s"} added`}
          </p>
          <p className="mt-0.5 text-xs text-[#86868b]">
            {ACCEPTED_IMAGE_LABEL} · Max {formatFileSize(MAX_FILE_SIZE_BYTES)}
          </p>
        </div>
        <button
          type="button"
          onClick={openFilePicker}
          className="shrink-0 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ed]"
        >
          Add image layer
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
