import type { AspectRatio, FitMode, ExportFormat } from "@/types/optimizer";

export interface SettingOption<T extends string> {
  value: T;
  label: string;
  description: string;
  badge?: string;
  helper?: string;
}

export const ASPECT_RATIO_OPTIONS: SettingOption<AspectRatio>[] = [
  {
    value: "original",
    label: "Original",
    description: "Keep the source image dimensions",
  },
  {
    value: "1:1",
    label: "Square",
    description: "1:1 · Instagram posts, profile images",
    badge: "1:1",
  },
  {
    value: "4:5",
    label: "Portrait",
    description: "4:5 · Instagram portrait feed",
    badge: "4:5",
  },
  {
    value: "9:16",
    label: "Story / Reel",
    description: "9:16 · Stories, Reels, TikTok",
    badge: "9:16",
  },
  {
    value: "16:9",
    label: "Landscape",
    description: "16:9 · Presentations, banners",
    badge: "16:9",
  },
  {
    value: "youtube-thumbnail",
    label: "YouTube Thumbnail",
    description: "16:9 · Recommended 1280 × 720",
    badge: "16:9",
  },
  {
    value: "twitter-post",
    label: "Twitter / X Post",
    description: "16:9 · In-feed image posts",
    badge: "16:9",
  },
  {
    value: "linkedin-post",
    label: "LinkedIn Post",
    description: "1.91:1 · Recommended 1200 × 627",
    badge: "1.91:1",
  },
];

export const FIT_MODE_OPTIONS: SettingOption<FitMode>[] = [
  {
    value: "contain-padding",
    label: "Contain with padding",
    description: "Shows the full image with neutral bars",
    helper:
      "Your entire screenshot stays visible. Empty space is filled with soft padding — nothing gets cropped.",
  },
  {
    value: "cover",
    label: "Cover crop",
    description: "Fills the frame edge to edge",
    helper:
      "Scales the image up and trims the edges to match the ratio. Ideal for thumbnails and banner crops.",
  },
  {
    value: "blur-background",
    label: "Blur background",
    description: "Full image over a blurred fill",
    helper:
      "Keeps every pixel of your screenshot in view while a blurred version fills the background — great for story formats.",
  },
];

export const EXPORT_FORMAT_OPTIONS: SettingOption<ExportFormat>[] = [
  { value: "png", label: "PNG", description: "Lossless, best for UI" },
  { value: "jpeg", label: "JPEG", description: "Smaller file size" },
  { value: "webp", label: "WebP", description: "Modern compression" },
];

export const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const ACCEPTED_IMAGE_EXTENSIONS = ".png,.jpg,.jpeg,.webp";

export const ACCEPTED_IMAGE_LABEL = "PNG, JPG, JPEG, or WebP";
