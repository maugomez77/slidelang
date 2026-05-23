# Slidelang — Technical Design Document
## AI Fund Build Challenge Submission

### Architecture Overview
```
Browser (React SPA)
├── PromptInput → AI Planner (OpenRouter / Ollama) → DeckSpec (JSON)
├── SpecEditor → Live edit blocks, kinds, themes, transitions
├── SlideRenderer → 20 slide kind layout renderers matching compiler output
├── Validator → 33 rules → auto-repair → validated spec
└── Publisher → HTML export, JSON save, print

CLI (Node.js)
├── compile-examples.ts → Batch compilation with vision QA
├── record-*.ts → Demo video generation (Ollama narration + TTS + FFmpeg)
└── mcp-ollama/ → MCP server (text, vision, video tools)
```

### Deck Spec Schema (`src/dsl/schema.ts`)
- **DeckSpec**: `{ meta: DeckMeta, slides: Slide[] }`
- **DeckMeta**: title, author, date, theme, description, fontH, fontB
- **SlideKind**: 20 variants (title, section, content, two-column, comparison, chart, kpi, dashboard, big-number, math, quote, image-full, logo-grid, team, timeline, flowchart, agenda, progress, contact, blank)
- **SlideBlock**: Union of TextBlock, ListBlock (bullets/numbered), ChartBlock, MathBlock, ImageBlock
- **ChartBlock**: bar, line, pie, donut — labels + datasets with colors
- **SlideTransition**: fade, slide, zoom, convex, concave
- **LayoutIssue**: 8 issue types with severity levels
- The schema is the single source of truth for compiler, editor, validator, and AI planner.

### Compiler (`src/dsl/compiler.ts` — 703 lines)
Pure function: `DeckSpec → compileDeckToHTML() → string (full HTML page)`

- Inlines CSS variables from theme (12 color tokens) or custom theme
- Maps 20 slide kinds to dedicated layout functions with CSS class mappings
- Inlines chart rendering as `<canvas>` + inline JS using Canvas 2D API (bar, line, pie, donut)
- Chart renderer: DPR-aware, gradient fills, legends, grid lines, axis labels — zero dependencies
- Uses KaTeX from CDN for math rendering (`$$` display, `$` inline)
- Uses Reveal.js 6 from CDN for presentation controls
- Auto-fix engine: corrects low-contrast inline colors, oversized KPI values at compile time
- Per-slide transitions via `data-transition` attributes
- Google Fonts loaded per theme with custom font overrides from DeckMeta
- All theme colors, fonts, and transitions baked into self-contained HTML output

### AI Planning (`src/ai/planner.ts` + `src/ai/ollama.ts`)
- **OpenRouter**: GPT-4o, Claude via chat completions API with JSON response format
- **Ollama**: Local models (llama3.2, qwen2.5, deepseek-r1) via `/api/generate`
- **Backend selector**: Persisted in localStorage, switchable at runtime
- **Fallback**: Built-in 7-slide template generator when no API key configured
- **Vision**: Image-to-deck via Ollama vision (`ollamaDescribeImage`)
- **API key**: Client-side only, stored in localStorage

### Browser Editor (`src/editor/SpecEditor.tsx` — 390 lines)
- **SpecEditor**: Tabbed slide navigation, raw JSON toggle, add/remove slides
- **SlideEditor**: Kind selector (20 options), title/subtitle/background inputs, transition picker (6 options), block list
- **BlockEditor**: Type-specific editors:
  - Text: textarea + AI Rewrite (formal, concise, persuasive, simplify, grammar via Ollama)
  - Lists: dynamic item array with add/remove
  - Image: URL + alt + Unsplash search integration (source.unsplash.com, no API key needed)
  - Chart: type selector + label/dataset display
  - Math: LaTeX expression input
- State persists to localStorage on every change

### Slide Renderer (`src/renderers/SlideRenderer.tsx` — 380 lines)
20 dedicated layout renderers matching compiler output pixel-for-pixel:
- Title, Section, Quote — centered typography with accent bars
- Content — auto-detected KPI cards from xlarge+small text pairs
- Two-Column, Comparison — grid layouts with panel styling
- Chart, Dashboard — Canvas 2D renderer with bar/line/pie/donut, legends, gradients
- KPI, Big Number — card grids, dramatic single-stat layouts
- Timeline — vertical line with dots, dates, titles, descriptions
- Flowchart — connected nodes with arrows
- Agenda — numbered items with descriptions
- Team — profile cards with photos
- Progress — labeled percentage bars
- Logo Grid, Image-Full, Contact — visual layouts
- Theme CSS variables injected for consistent coloring

### Chart Renderer (`src/renderers/ChartRenderer.tsx` — 130 lines)
- Pure Canvas 2D, zero dependencies
- Bar: multi-dataset grouped bars, gradient fills, values above bars, grid lines, legend
- Line: multi-series lines with dot markers, grid lines
- Pie/Donut: slices with percentage labels, legend
- DPR-aware rendering for sharp output on Retina displays
- Theme-aware color palette from CSS variables

### Validation & Repair (`src/validation/validator.ts`)
- 33 validation rules across 8 categories: structure, content, text, layout, charts, math, images, accessibility
- Auto-repair engine fixes: low-contrast text, oversized KPIs, empty slides, missing alt text
- Vision QA (CLI): Playwright renders slides, screenshots, Ollama vision checks for rendering issues
- Design critique module: Vision model reviews contrast, alignment, spacing, readability

### Theme & Font System (`src/components/ThemeBuilder.tsx`)
- 8 built-in themes (noir, air, bold, warm, crimson, sage, navy, neon)
- 12 color variables per theme (bg, surf, acc, a2, tx, tx2, hd, bd, ok, err, wrn, grd)
- Custom theme creation with localStorage persistence
- 8 heading fonts + 8 body fonts, dynamically loaded from Google Fonts
- Theme CSS variables injected at runtime, compiled into HTML output

### Publishing (`src/publishing/publisher.ts`)
- HTML export: Full deck compiled to self-contained HTML file
- JSON export: Portable deck spec
- Print: Browser print dialog
- Deployment: GitHub Pages via CI workflow

### MCP Server (`mcp-ollama/`)
- Stdio transport, TypeScript SDK
- 4 tools: ollama_generate, ollama_describe_image, ollama_list_models, create_demo_video
- Vision: reads image from disk, base64-encodes, sends to llama3.2-vision
- Video: generates demo videos from deck specs (narration + TTS + FFmpeg)

### Demo Pipeline (`record-*.ts`)
- Narration: Ollama generates scripts → macOS TTS (say) converts to audio
- Rendering: Playwright screenshots each slide
- Compositing: FFmpeg merges screenshots + audio → MP4
- Vision QA: Optional per-slide quality check via llama3.2-vision
