import { validateImageFile } from "@/lib/imageValidation";
import type { UploadedImage } from "@/types/optimizer";

export function loadUploadedImageFromFile(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.message ?? "Unable to upload this file."));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      resolve({
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(
        new Error(
          "This image could not be loaded. The file may be corrupted or unsupported.",
        ),
      );
    };

    img.src = previewUrl;
  });
}
