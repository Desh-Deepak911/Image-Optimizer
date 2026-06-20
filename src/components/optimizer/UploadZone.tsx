"use client";

import { useCallback, useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_LABEL,
} from "@/lib/constants";
import { MAX_FILE_SIZE_BYTES } from "@/lib/imageValidation";
import { formatFileSize } from "@/lib/formatters";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  hasImage: boolean;
}

export function UploadZone({ onFileSelect, hasImage }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
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

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const dragHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_EXTENSIONS}
      className="hidden"
      onChange={handleInputChange}
    />
  );

  if (hasImage) {
    return (
      <div
        {...dragHandlers}
        className={`rounded-2xl border px-4 py-3 shadow-sm transition-all duration-200 ${
          isDragging
            ? "border-[#0071e3] bg-[#0071e3]/[0.04]"
            : "border-black/[0.06] bg-white"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#6e6e73]">
            {isDragging
              ? "Drop to replace the current image"
              : "Drop a new file here or browse to replace."}
          </p>
          <button
            type="button"
            onClick={openFilePicker}
            className="shrink-0 rounded-full bg-[#f5f5f7] px-4 py-2 text-sm font-medium text-[#1d1d1f] transition-colors hover:bg-[#e8e8ed]"
          >
            Replace image
          </button>
        </div>
        {fileInput}
      </div>
    );
  }

  return (
    <div
      {...dragHandlers}
      className={`relative flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 transition-all duration-200 sm:min-h-[300px] sm:px-6 sm:py-12 ${
        isDragging
          ? "border-[#0071e3] bg-[#0071e3]/[0.04]"
          : "border-black/[0.08] bg-[#fafafa] hover:border-black/[0.12] hover:bg-[#f5f5f7]"
      }`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
          isDragging ? "bg-[#0071e3]/10" : "bg-white shadow-sm"
        }`}
      >
        <svg
          className={`h-7 w-7 ${isDragging ? "text-[#0071e3]" : "text-[#86868b]"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <p className="text-base font-medium text-[#1d1d1f]">
        {isDragging ? "Drop your image here" : "Drag and drop your screenshot"}
      </p>
      <p className="mt-1 text-sm text-[#86868b]">{ACCEPTED_IMAGE_LABEL}</p>
      <p className="mt-0.5 text-xs text-[#86868b]">
        Max {formatFileSize(MAX_FILE_SIZE_BYTES)}
      </p>

      <button
        type="button"
        onClick={openFilePicker}
        className="mt-6 rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ed] active:bg-[#006edb]"
      >
        Choose file
      </button>

      {fileInput}
    </div>
  );
}
