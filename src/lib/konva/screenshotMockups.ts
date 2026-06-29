import type { LayerPlacement } from "@/lib/konva/quickLayouts";
import {
  createShapeLayerAt,
  createTextLayerAt,
  type EditorLayer,
  type ImageEditorLayer,
  type ImageLayerStyle,
  type StageBackground,
} from "@/types/konvaEditor";

export type ScreenshotMockupId = "browser" | "mac-window" | "mobile-phone";

export interface ScreenshotMockupOption {
  id: ScreenshotMockupId;
  label: string;
  description: string;
}

export const SCREENSHOT_MOCKUP_OPTIONS: ScreenshotMockupOption[] = [
  {
    id: "browser",
    label: "Browser frame",
    description: "Chrome-style window with URL bar",
  },
  {
    id: "mac-window",
    label: "Mac window",
    description: "macOS window with traffic lights",
  },
  {
    id: "mobile-phone",
    label: "Phone frame",
    description: "Mobile device with notch and bezel",
  },
];

export interface ScreenshotMockupResult {
  screenshotPlacement: LayerPlacement;
  screenshotStyle: Partial<ImageLayerStyle>;
  frameLayers: EditorLayer[];
  background?: Partial<StageBackground>;
}

export const FRAME_LAYER_PREFIX = "Frame ·";
export const COMPARISON_LAYER_PREFIX = "Comparison ·";

function scaleSize(value: number, stageWidth: number, stageHeight: number): number {
  return Math.round(value * (Math.min(stageWidth, stageHeight) / 1080));
}

function containInRect(
  naturalWidth: number,
  naturalHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
): LayerPlacement {
  const scale = Math.min(width / naturalWidth, height / naturalHeight);
  const nextWidth = naturalWidth * scale;
  const nextHeight = naturalHeight * scale;

  return {
    x: x + (width - nextWidth) / 2,
    y: y + (height - nextHeight) / 2,
    width: nextWidth,
    height: nextHeight,
  };
}

function buildBrowserMockup(
  image: Pick<ImageEditorLayer, "image">,
  stageWidth: number,
  stageHeight: number,
): ScreenshotMockupResult {
  const frameWidth = Math.round(stageWidth * 0.82);
  const titleBarHeight = scaleSize(44, stageWidth, stageHeight);
  const bezel = scaleSize(10, stageWidth, stageHeight);
  const contentWidth = frameWidth - bezel * 2;
  const contentHeight = Math.round(contentWidth * 0.56);
  const frameHeight = titleBarHeight + contentHeight + bezel * 2;
  const frameX = (stageWidth - frameWidth) / 2;
  const frameY = (stageHeight - frameHeight) / 2;
  const contentX = frameX + bezel;
  const contentY = frameY + titleBarHeight + bezel;

  const screenshotPlacement = containInRect(
    image.image.width,
    image.image.height,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
  );

  const urlBarX = frameX + scaleSize(96, stageWidth, stageHeight);
  const urlBarY = frameY + scaleSize(10, stageWidth, stageHeight);
  const urlBarWidth = frameWidth - scaleSize(112, stageWidth, stageHeight);
  const urlBarHeight = scaleSize(24, stageWidth, stageHeight);
  const dotRadius = scaleSize(6, stageWidth, stageHeight);
  const dotY = frameY + titleBarHeight / 2;

  const frameLayers: EditorLayer[] = [
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Browser · window`,
      shape: "rectangle",
      x: frameX,
      y: frameY,
      width: frameWidth,
      height: frameHeight,
      fill: "#ffffff",
      shadowStyle: {
        shadowBlur: scaleSize(28, stageWidth, stageHeight),
        shadowColor: "#000000",
        shadowOffsetY: scaleSize(12, stageWidth, stageHeight),
        shadowOpacity: 0.18,
      },
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Browser · title bar`,
      shape: "rectangle",
      x: frameX,
      y: frameY,
      width: frameWidth,
      height: titleBarHeight,
      fill: "#ececf1",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Browser · URL bar`,
      shape: "rectangle",
      x: urlBarX,
      y: urlBarY,
      width: urlBarWidth,
      height: urlBarHeight,
      fill: "#ffffff",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Browser · close`,
      shape: "circle",
      x: frameX + scaleSize(22, stageWidth, stageHeight),
      y: dotY,
      width: dotRadius * 2,
      height: dotRadius * 2,
      fill: "#ff5f57",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Browser · minimize`,
      shape: "circle",
      x: frameX + scaleSize(42, stageWidth, stageHeight),
      y: dotY,
      width: dotRadius * 2,
      height: dotRadius * 2,
      fill: "#febc2e",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Browser · maximize`,
      shape: "circle",
      x: frameX + scaleSize(62, stageWidth, stageHeight),
      y: dotY,
      width: dotRadius * 2,
      height: dotRadius * 2,
      fill: "#28c840",
    }),
  ];

  return {
    screenshotPlacement,
    screenshotStyle: {
      cornerRadius: scaleSize(4, stageWidth, stageHeight),
      borderWidth: 1,
      borderColor: "#d2d2d7",
      shadowBlur: 0,
    },
    frameLayers,
    background: {
      transparent: false,
      fillType: "linear",
      color: "#f5f5f7",
      gradientAngle: 180,
      gradientStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#eef0f4" },
      ],
    },
  };
}

function buildMacWindowMockup(
  image: Pick<ImageEditorLayer, "image">,
  stageWidth: number,
  stageHeight: number,
): ScreenshotMockupResult {
  const frameWidth = Math.round(stageWidth * 0.8);
  const titleBarHeight = scaleSize(34, stageWidth, stageHeight);
  const bezel = scaleSize(8, stageWidth, stageHeight);
  const contentWidth = frameWidth - bezel * 2;
  const contentHeight = Math.round(contentWidth * 0.58);
  const frameHeight = titleBarHeight + contentHeight + bezel * 2;
  const frameX = (stageWidth - frameWidth) / 2;
  const frameY = (stageHeight - frameHeight) / 2;
  const contentX = frameX + bezel;
  const contentY = frameY + titleBarHeight + bezel;
  const dotRadius = scaleSize(6, stageWidth, stageHeight);
  const dotY = frameY + titleBarHeight / 2;

  const screenshotPlacement = containInRect(
    image.image.width,
    image.image.height,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
  );

  const frameLayers: EditorLayer[] = [
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Mac · window`,
      shape: "rectangle",
      x: frameX,
      y: frameY,
      width: frameWidth,
      height: frameHeight,
      fill: "#ffffff",
      shadowStyle: {
        shadowBlur: scaleSize(32, stageWidth, stageHeight),
        shadowColor: "#000000",
        shadowOffsetY: scaleSize(16, stageWidth, stageHeight),
        shadowOpacity: 0.22,
      },
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Mac · title bar`,
      shape: "rectangle",
      x: frameX,
      y: frameY,
      width: frameWidth,
      height: titleBarHeight,
      fill: "#ececec",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Mac · close`,
      shape: "circle",
      x: frameX + scaleSize(20, stageWidth, stageHeight),
      y: dotY,
      width: dotRadius * 2,
      height: dotRadius * 2,
      fill: "#ff5f57",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Mac · minimize`,
      shape: "circle",
      x: frameX + scaleSize(40, stageWidth, stageHeight),
      y: dotY,
      width: dotRadius * 2,
      height: dotRadius * 2,
      fill: "#febc2e",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Mac · maximize`,
      shape: "circle",
      x: frameX + scaleSize(60, stageWidth, stageHeight),
      y: dotY,
      width: dotRadius * 2,
      height: dotRadius * 2,
      fill: "#28c840",
    }),
  ];

  return {
    screenshotPlacement,
    screenshotStyle: {
      cornerRadius: scaleSize(2, stageWidth, stageHeight),
      borderWidth: 1,
      borderColor: "#d1d1d6",
      shadowBlur: 0,
    },
    frameLayers,
    background: {
      transparent: false,
      fillType: "radial",
      color: "#dfe3ea",
      gradientStops: [
        { offset: 0, color: "#f7f8fb" },
        { offset: 1, color: "#dfe3ea" },
      ],
    },
  };
}

function buildMobilePhoneMockup(
  image: Pick<ImageEditorLayer, "image">,
  stageWidth: number,
  stageHeight: number,
): ScreenshotMockupResult {
  const phoneHeight = Math.round(stageHeight * 0.82);
  const phoneWidth = Math.round(phoneHeight * 0.46);
  const bezel = scaleSize(12, stageWidth, stageHeight);
  const notchHeight = scaleSize(24, stageWidth, stageHeight);
  const homeIndicatorHeight = scaleSize(16, stageWidth, stageHeight);
  const frameX = (stageWidth - phoneWidth) / 2;
  const frameY = (stageHeight - phoneHeight) / 2;
  const screenX = frameX + bezel;
  const screenY = frameY + bezel + notchHeight;
  const screenWidth = phoneWidth - bezel * 2;
  const screenHeight = phoneHeight - bezel * 2 - notchHeight - homeIndicatorHeight;

  const screenshotPlacement = containInRect(
    image.image.width,
    image.image.height,
    screenX,
    screenY,
    screenWidth,
    screenHeight,
  );

  const frameLayers: EditorLayer[] = [
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Phone · body`,
      shape: "rectangle",
      x: frameX,
      y: frameY,
      width: phoneWidth,
      height: phoneHeight,
      fill: "#1d1d1f",
      shadowStyle: {
        shadowBlur: scaleSize(36, stageWidth, stageHeight),
        shadowColor: "#000000",
        shadowOffsetY: scaleSize(18, stageWidth, stageHeight),
        shadowOpacity: 0.28,
      },
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Phone · screen`,
      shape: "rectangle",
      x: screenX,
      y: frameY + bezel,
      width: screenWidth,
      height: phoneHeight - bezel * 2,
      fill: "#000000",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Phone · notch`,
      shape: "rectangle",
      x: frameX + phoneWidth * 0.32,
      y: frameY + bezel,
      width: phoneWidth * 0.36,
      height: notchHeight,
      fill: "#1d1d1f",
    }),
    createShapeLayerAt({
      name: `${FRAME_LAYER_PREFIX} Phone · home indicator`,
      shape: "rectangle",
      x: frameX + phoneWidth * 0.35,
      y: frameY + phoneHeight - bezel - scaleSize(8, stageWidth, stageHeight),
      width: phoneWidth * 0.3,
      height: scaleSize(5, stageWidth, stageHeight),
      fill: "#f5f5f7",
    }),
  ];

  return {
    screenshotPlacement,
    screenshotStyle: {
      cornerRadius: scaleSize(8, stageWidth, stageHeight),
      mask: "rounded",
      borderWidth: 0,
      shadowBlur: 0,
    },
    frameLayers,
    background: {
      transparent: false,
      fillType: "linear",
      color: "#eef1f6",
      gradientAngle: 160,
      gradientStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#dbe2ec" },
      ],
    },
  };
}

export function buildScreenshotMockup(
  mockupId: ScreenshotMockupId,
  image: Pick<ImageEditorLayer, "image">,
  stageWidth: number,
  stageHeight: number,
): ScreenshotMockupResult {
  switch (mockupId) {
    case "browser":
      return buildBrowserMockup(image, stageWidth, stageHeight);
    case "mac-window":
      return buildMacWindowMockup(image, stageWidth, stageHeight);
    case "mobile-phone":
      return buildMobilePhoneMockup(image, stageWidth, stageHeight);
  }
}

export function buildAutoPaddingStyle(
  stageWidth: number,
  stageHeight: number,
): Partial<ImageLayerStyle> {
  const radius = scaleSize(14, stageWidth, stageHeight);

  return {
    mask: "rounded",
    cornerRadius: radius,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    shadowBlur: scaleSize(24, stageWidth, stageHeight),
    shadowColor: "#000000",
    shadowOffsetY: scaleSize(10, stageWidth, stageHeight),
    shadowOpacity: 0.2,
    glowBlur: 0,
  };
}

export function buildAutoPaddingPlacement(
  image: Pick<ImageEditorLayer, "image">,
  stageWidth: number,
  stageHeight: number,
): LayerPlacement {
  const inset = Math.round(Math.min(stageWidth, stageHeight) * 0.12);

  return containInRect(
    image.image.width,
    image.image.height,
    inset,
    inset,
    stageWidth - inset * 2,
    stageHeight - inset * 2,
  );
}

export function isAuxiliaryLayer(layer: EditorLayer, prefix: string): boolean {
  return layer.name.startsWith(prefix);
}

export function createComparisonDividerLayer(
  x: number,
  y: number,
  height: number,
  stageWidth: number,
  stageHeight: number,
): EditorLayer {
  return createShapeLayerAt({
    name: `${COMPARISON_LAYER_PREFIX} Divider`,
    shape: "line",
    x,
    y,
    width: 0,
    height,
    fill: "#ffffff",
    strokeWidth: scaleSize(3, stageWidth, stageHeight),
  });
}

export function createComparisonLabelLayer(
  text: string,
  x: number,
  y: number,
  stageWidth: number,
  stageHeight: number,
): EditorLayer {
  return createTextLayerAt({
    name: `${COMPARISON_LAYER_PREFIX} ${text}`,
    text,
    x,
    y,
    width: scaleSize(160, stageWidth, stageHeight),
    fontSize: scaleSize(22, stageWidth, stageHeight),
    fill: "#ffffff",
    locked: false,
  });
}

export function buildComparisonSplitLayers(
  leftCell: { x: number; y: number; width: number; height: number },
  rightCell: { x: number; y: number; width: number; height: number },
  stageWidth: number,
  stageHeight: number,
  showLabels: boolean,
): EditorLayer[] {
  const dividerX = rightCell.x - (rightCell.x - (leftCell.x + leftCell.width)) / 2;
  const layers: EditorLayer[] = [
    createComparisonDividerLayer(
      dividerX,
      leftCell.y,
      leftCell.height,
      stageWidth,
      stageHeight,
    ),
  ];

  if (showLabels) {
    const labelOffset = scaleSize(16, stageWidth, stageHeight);
    const labelY = leftCell.y + labelOffset;
    layers.push(
      createComparisonLabelLayer(
        "Before",
        leftCell.x + labelOffset,
        labelY,
        stageWidth,
        stageHeight,
      ),
      createComparisonLabelLayer(
        "After",
        rightCell.x + labelOffset,
        labelY,
        stageWidth,
        stageHeight,
      ),
    );
  }

  return layers;
}
