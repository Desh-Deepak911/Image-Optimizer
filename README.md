# Image Optimizer

A browser-only screenshot and photo optimizer. Upload an image, crop it to popular aspect ratios, choose a fit mode, and export — all processed locally on your device. No backend, no account, and no paid APIs.

## Features

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
- **Privacy-first** — no backend, no paid APIs; images never leave your browser

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Image processing | Browser [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |

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

## Privacy & processing

All image processing happens **entirely in your browser**. When you upload a file, it is read into memory on your device. Export uses the Canvas API to render the final image and trigger a local download. Nothing is sent to a server for conversion or storage.

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
├── app/              # Next.js app router (layout, page, styles)
├── components/       # UI components (optimizer workspace, settings, preview)
├── hooks/            # Client state (upload, settings, export)
├── lib/              # Canvas export, validation, aspect ratio utilities
└── types/            # Shared TypeScript types
```

## Future improvements

- **Batch processing** — optimize multiple images in one session
- **Smart crop detection** — suggest focal points and auto-frame subjects
- **Platform presets** — one-click export sizes for Instagram, YouTube, LinkedIn, and more
- **Optional AI upscaling** — client-side or opt-in enhancement for low-resolution sources

## License

Private project — add a license if you plan to open-source it.
