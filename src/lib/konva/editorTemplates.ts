import type { StageBackground } from "@/types/konvaEditor";

export interface EditorTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  aspectLabel: string;
  background: StageBackground;
}

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: "instagram-story",
    name: "Instagram Story",
    description: "Full-screen vertical story format",
    width: 1080,
    height: 1920,
    aspectLabel: "9:16",
    background: { color: "#ffffff", transparent: false },
  },
  {
    id: "instagram-post",
    name: "Instagram Post",
    description: "Square feed post",
    width: 1080,
    height: 1080,
    aspectLabel: "1:1",
    background: { color: "#ffffff", transparent: false },
  },
  {
    id: "instagram-portrait",
    name: "Instagram Portrait",
    description: "Portrait feed post",
    width: 1080,
    height: 1350,
    aspectLabel: "4:5",
    background: { color: "#ffffff", transparent: false },
  },
  {
    id: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    description: "Landscape video thumbnail",
    width: 1920,
    height: 1080,
    aspectLabel: "16:9",
    background: { color: "#0f0f0f", transparent: false },
  },
  {
    id: "linkedin-post",
    name: "LinkedIn Post",
    description: "LinkedIn link preview image",
    width: 1200,
    height: 627,
    aspectLabel: "1.91:1",
    background: { color: "#ffffff", transparent: false },
  },
  {
    id: "app-screenshot",
    name: "App Screenshot",
    description: "Tall phone screenshot frame",
    width: 1290,
    height: 2796,
    aspectLabel: "Phone",
    background: { color: "#f5f5f7", transparent: false },
  },
  {
    id: "before-after-collage",
    name: "Before / After Collage",
    description: "Wide comparison canvas for two screenshots",
    width: 1920,
    height: 1080,
    aspectLabel: "16:9",
    background: {
      color: "#111111",
      transparent: false,
      fillType: "solid",
    },
  },
  {
    id: "screenshot-showcase",
    name: "Screenshot Showcase",
    description: "Clean canvas for framed product screenshots",
    width: 1600,
    height: 1000,
    aspectLabel: "16:10",
    background: {
      color: "#f5f5f7",
      transparent: false,
      fillType: "linear",
      gradientAngle: 180,
      gradientStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#eef0f4" },
      ],
    },
  },
];

export function getEditorTemplate(id: string): EditorTemplate | undefined {
  return EDITOR_TEMPLATES.find((template) => template.id === id);
}
