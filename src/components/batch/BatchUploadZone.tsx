"use client";

import { useCallback, useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_LABEL,
} from "@/lib/constants";
import { formatFileSize } from "@/lib/formatters";
import { MAX_FILE_SIZE_BYTES } from "@/lib/imageValidation";
import { MAX_BATCH_COUNT } from "@/types/batch";

interface BatchUploadZoneProps {
  itemCount: number;
  maxCount: number;
  onFilesSelect: (files: FileList | File[]) => void;
}

export function BatchUploadZone({
  itemCount,
  maxCount,
  onFilesSelect,
}: BatchUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const isFull = itemCount >= maxCount;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || isFull) {
        return;
      }

      onFilesSelect(files);
    },
    [isFull, onFilesSelect],
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      event.target.value = "";
    },
    [handleFiles],
  );

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:px-6 ${
        isFull
          ? "cursor-not-allowed border-black/[0.06] bg-[#f5f5f7] opacity-60"
          : isDragging
            ? "border-[#0071e3] bg-[#0071e3]/[0.04]"
            : "border-black/[0.08] bg-white hover:border-[#0071e3]/40"
      }`}
      onDragEnter={isFull ? undefined : handleDragEnter}
      onDragLeave={isFull ? undefined : handleDragLeave}
      onDragOver={isFull ? undefined : handleDragOver}
      onDrop={isFull ? undefined : handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        multiple
        disabled={isFull}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload batch images"
      />

      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-6 w-6"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1d1d1f]">
            {isFull ? "Batch is full" : "Add images to batch"}
          </p>
          <p className="mt-1 text-xs text-[#86868b]">
            Drag and drop or{" "}
            <button
              type="button"
              disabled={isFull}
              onClick={() => inputRef.current?.click()}
              className="font-medium text-[#0071e3] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              browse files
            </button>
          </p>
        </div>

        <p className="text-xs text-[#86868b]">
          {ACCEPTED_IMAGE_LABEL} · Max {formatFileSize(MAX_FILE_SIZE_BYTES)} each
          · Up to {MAX_BATCH_COUNT} images ({itemCount}/{maxCount} added)
        </p>
      </div>
    </div>
  );
}
