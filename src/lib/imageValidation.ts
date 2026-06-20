import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export type ImageValidationErrorCode =
  | "invalid_type"
  | "file_too_large"
  | "invalid_image";

export interface ImageValidationResult {
  valid: boolean;
  error?: ImageValidationErrorCode;
  message?: string;
}

const ACCEPTED_EXTENSIONS = new Set(
  ACCEPTED_IMAGE_EXTENSIONS.split(",").map((ext) => ext.trim().toLowerCase()),
);

function hasAcceptedExtension(fileName: string): boolean {
  const extension = `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`;
  return ACCEPTED_EXTENSIONS.has(extension);
}

export function validateImageFile(file: File): ImageValidationResult {
  const isAcceptedMime = ACCEPTED_IMAGE_TYPES.includes(file.type);
  const isAcceptedExtension = hasAcceptedExtension(file.name);

  if (!isAcceptedMime && !isAcceptedExtension) {
    return {
      valid: false,
      error: "invalid_type",
      message: "Please upload a PNG, JPG, JPEG, or WebP image.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "file_too_large",
      message: "This file is too large. Please choose an image under 20 MB.",
    };
  }

  return { valid: true };
}
