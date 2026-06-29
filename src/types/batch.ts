import type { OptimizerSettings, UploadedImage } from "@/types/optimizer";
import { DEFAULT_SETTINGS } from "@/types/optimizer";

export const MAX_BATCH_COUNT = 30;
export const BATCH_ZIP_FILENAME = "image-optimizer-batch.zip";

export type BatchItemStatus = "pending" | "processing" | "done" | "failed";

export interface BatchSettings extends OptimizerSettings {
  containBackgroundColor: string;
}

export const DEFAULT_BATCH_SETTINGS: BatchSettings = {
  ...DEFAULT_SETTINGS,
  containBackgroundColor: "#e8e8ed",
};

export interface BatchItem {
  id: string;
  image: UploadedImage;
  status: BatchItemStatus;
  error?: string;
  resultBlob?: Blob;
  resultFilename?: string;
}

export function createBatchItemId(): string {
  return `batch-${crypto.randomUUID()}`;
}
