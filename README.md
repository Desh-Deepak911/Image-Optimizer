# Image Optimizer

A browser-only screenshot and photo optimizer with a multi-layer advanced editor. Upload images, crop to popular aspect ratios, compose designs with text and shapes, and export — all processed locally on your device. No backend, no account, and no paid APIs.

## Features

### Optimizer mode

- **Upload** PNG, JPG, JPEG, and WebP (drag-and-drop or file picker, up to 20 MB)
- **Resize by aspect ratio** — Original, Square (1:1), Portrait (4:5), Story/Reel (9:16), Landscape (16:9), and platform-oriented presets
- **Fit modes**
  - **Contain with padding** — full image visible with letterboxing
  - **Cover crop** — fills the frame and crops overflow
  - **Blur background** — full image over a blurred backdrop
- **Export formats** — PNG, JPEG, and WebP
- **Quality slider** — adjustable compression for JPEG and WebP (50–100%)
- **Output size controls** — 1080px, 1440px, 1920px, or custom width
- **Before/after metadata** — compare original and output file size and dimensions

### Batch export mode

Switch to **Batch export** to optimize many images with one shared preset:

- **Multi-file upload** — add up to 30 PNG, JPG, JPEG, or WebP images (20 MB each)
- **Shared settings** — aspect ratio, fit mode (contain, cover, blur background), output width, export format, and quality
- **Contain background color** — customize letterbox padding when using contain mode
- **Live preview** — select any queued image to preview batch settings before processing
- **Batch processing** — process all images in the browser with per-file status (pending, processing, done, failed)
- **ZIP download** — export all processed files as `image-optimizer-batch.zip` with `-optimized` filenames
- **Queue controls** — remove individual files, clear batch, retry failed items

### Advanced editor mode

Switch to **Advanced editor** for a full canvas composition workflow powered by [react-konva](https://konvajs.org/docs/react/):

#### Canvas & layers

- **Multi-layer canvas** — add multiple images, text, and shapes on one artboard
- **Transform tools** — drag, resize, and rotate any layer with on-canvas handles
- **Layer panel** — reorder, duplicate, lock, hide, and delete layers
- **Undo / redo** — snapshot-based history (up to 50 steps)
- **Keyboard shortcuts**
  - `Delete` / `Backspace` — remove selected layer
  - `⌘/Ctrl + Z` — undo
  - `⌘/Ctrl + Shift + Z` — redo

#### Templates & layouts

- **Template gallery** — Instagram Story/Post/Portrait, YouTube Thumbnail, LinkedIn Post, App Screenshot, Before/After Collage, Screenshot Showcase
- **Quick layouts** — side-by-side, before/after, before/after collage, comparison split, 3- and 4-image grids, centered screenshot, auto-padding, blur background poster
- **Screenshot tools** — browser, Mac window, and phone device frames; auto-padding; clean background presets; comparison layouts with divider and Before/After labels

#### Editing tools

- **Image filters** — brightness, contrast, saturation, blur, grayscale, and sepia
- **Image styling** — rounded corners, border, drop shadow, and glow
- **Crop** — interactive crop with reset; source-region editing on image layers
- **Image masks** — none, rectangle, rounded rectangle, and circle
- **Text tool** — editable text with font size, color, and opacity
- **Shapes** — rectangle, circle, and line with fill/stroke controls
- **Background** — solid color, linear/radial gradients, and preset gradients, or transparent (checkerboard preview)

#### Layout & precision

- **Layer quick actions** — center, fit/fill canvas, duplicate, reorder, reset effects
- **Alignment controls** — align left, center, right, top, middle, bottom
- **Right-click context menu** — duplicate, bring forward, send backward, center, fit/fill, reset effects, delete
- **Snap guides** — snap to canvas center/edges and other layer edges while dragging
- **Canvas zoom** — zoom in/out, reset zoom, fit canvas to screen

#### Export & projects

- **Canvas size presets** — 1080×1080, 1080×1350, 1080×1920, 1920×1080, or custom
- **Export size presets** — current canvas size, social presets, or custom output dimensions
- **Export formats** — PNG, JPEG, and WebP (with quality control); transformer handles and editing guides are hidden from exports
- **Save designs locally** — save to browser localStorage, reopen recent designs, rename, and delete
- **Project JSON** — export and import full project files (canvas, layers, styling, filters, and export settings)

#### Mobile

- Responsive layout with scrollable sidebar and fixed mobile download bar
- Touch-friendly canvas editing on smaller screens

### Privacy

All processing happens **entirely in your browser**. Images are read into memory on your device and exported via the Canvas API. Saved projects stay in your browser’s local storage. Nothing is sent to a server.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Canvas editor | [Konva](https://konvajs.org) + [react-konva](https://konvajs.org/docs/react/) |
| Image processing | Browser [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| Batch ZIP export | [JSZip](https://stuk.github.io/jszip/) |

## Local setup

**Prerequisites:** Node.js 20+ and npm

```bash
# Clone the repository
git clone <your-repo-url>
cd Image-Optimizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build   # Production build
npm run start   # Run production server locally
npm run lint    # Run ESLint
```

## Deploy on Vercel

This app is a static-friendly Next.js frontend and deploys cleanly to [Vercel](https://vercel.com).

1. Push the project to GitHub, GitLab, or Bitbucket.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js — no extra build configuration is required.
4. Deploy. The default settings work out of the box:
   - **Build command:** `npm run build`
   - **Output:** Next.js default
   - **Install command:** `npm install`

Alternatively, use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

No environment variables or external services are needed for core functionality.

## Project structure

```
src/
├── app/                    # Next.js app router (layout, page, styles)
├── components/
│   ├── advanced/           # Konva editor (canvas, layers, projects, export)
│   ├── batch/              # Batch export workspace and controls
│   ├── editor/             # Optimizer-mode interactive viewport
│   └── optimizer/          # Shared UI shell and optimizer workspace
├── hooks/                  # Client state (upload, settings, history, projects)
├── lib/
│   ├── konva/              # Stage export, filters, layouts, project storage
│   └── render/             # Optimizer geometry and draw pipeline
└── types/                  # Shared TypeScript types
```

## Future improvements

- **Smart crop detection** — suggest focal points and auto-frame subjects
- **Optional AI upscaling** — client-side or opt-in enhancement for low-resolution sources

## License

Private project — add a license if you plan to open-source it.
