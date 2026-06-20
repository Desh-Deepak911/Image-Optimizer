export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFileType(mimeType: string, fileName: string): string {
  const mimeLabels: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "image/webp": "WebP",
  };

  if (mimeLabels[mimeType]) {
    return mimeLabels[mimeType];
  }

  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension ?? "Unknown";
}
