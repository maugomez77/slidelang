# Slidelang — Product Requirements Document
## AI Fund Build Challenge Submission

### Problem
Teams using AI for slide generation get static, brittle output that is hard to edit. Current tools produce prompt-to-slide output that breaks on regeneration, lacks structured data primitives (charts, math, images), and offers no validation or repair. Users spend more time fighting the output than creating the deck.

### Target User & Workflow
**Primary**: Knowledge workers building recurring business decks (quarterly reviews, pitch decks, technical talks, investor updates) who want AI assistance without losing editability.

**Workflow**: Prompt → Structured spec → Live editor with preview → Validation & repair → Compile → Publish

### Why Structured Authoring Beats Prompt-to-Static-Slides
1. **Deterministic spec**: The deck spec (JSON) is the source of truth. AI generates the spec, not the final pixels.
2. **Editability**: Users edit the spec through a browser editor with live WYSIWYG preview. No re-prompting needed.
3. **Validation**: 33 rules check overflow, contrast, missing data, empty content. Auto-repair fixes issues at compile time.
4. **Composability**: 6 block types (text, bullets, numbered, chart, math, image) compose into 20 slide kinds.
5. **Version control**: JSON spec is git-friendly, inspectable, and shareable independent of rendered output.

### Key Capabilities
- **Multi-backend AI**: OpenRouter (GPT-4o, Claude) + local Ollama (llama3.2, qwen2.5) with backend selector
- **Deck compiler**: Spec → self-contained HTML with Reveal.js, inline Canvas 2D charts, KaTeX math, 8 themes
- **20 slide kinds**: title, section, content, two-column, comparison, chart, kpi, dashboard, big-number, math, quote, image-full, logo-grid, team, timeline, flowchart, agenda, progress, contact, blank
- **Chart rendering**: Bar, line, pie, donut — pure Canvas 2D, zero external chart library dependencies
- **Math rendering**: KaTeX with CDN loading, LaTeX expressions embedded in spec
- **Theme system**: 8 presets with 12 color variables each, custom theme builder with color pickers, font selector (Google Fonts)
- **Validation**: 33 rules covering structure, content, layout, chart data, math, accessibility, color contrast
- **Auto-repair**: Compile-time fixes for contrast, KPI overflow, missing alt text, empty slides
- **Browser editor**: Per-slide editing with visual kind picker (20 kinds with icons), block-level controls, raw JSON mode, Unsplash image search, AI text rewrite (formal/concise/persuasive/grammar)
- **Drag-and-drop**: Slide reorder in thumbnail strip
- **Undo/redo**: Cmd+Z / Cmd+Shift+Z with 50-state history
- **Duplicate/delete slides**: One-click copy or remove with keyboard-safe selection
- **Export**: Self-contained HTML, PPTX (PowerPoint/Google Slides import), JSON spec
- **Vision QA**: CLI pipeline that screenshots each slide and checks for rendering issues via Ollama vision
- **AI Design Critique**: In-app analysis of slide content for text density, readability, contrast, and layout balance with one-click auto-fix
- **MCP server**: Ollama integration for AI assistants — text generation, vision, demo video creation
- **Live presentation mode**: Full-screen with keyboard navigation, progress bar, theme-aware rendering
- **Image-to-deck**: Upload an image, AI describes it via Ollama vision and generates a deck from the description

### Depth Areas
1. **DSL design**: Typed schema with 20 slide kinds, 6 block types, 4 chart types, styling primitives, transitions
2. **Compiler architecture**: Pure function transforming spec → self-contained HTML with inline rendering
3. **Layout validation**: Rule-based engine + auto-repair at compile time
4. **Chart/math rendering**: Zero-dependency Canvas 2D charts, KaTeX math integration
5. **AI integration**: Multi-backend prompt → spec pipeline with fallback generation
6. **MCP/CLI workflow**: Ollama MCP server, vision QA pipeline, demo video generation

### Wedge & Platform Path
**Wedge**: Recurring business and technical decks (quarterly reviews, pitch decks, conference talks).
**Expansion**: Team collaboration → template marketplace → live data binding → plugin system → CLI for CI/CD.

### Success Metrics
- Time from prompt to publishable deck < 5 minutes
- 33 validation rules catch > 90% of common layout issues
- Spec compilation to HTML in < 1 second
- Zero external dependencies for core rendering (charts, layout)
- Editor preview matches compiled output pixel-for-pixel

### What I Personally Built
- **DSL schema** (`src/dsl/schema.ts`): TypeScript types for 20 slide kinds, 6 block types, 6 chart types, transitions, layout issues, themes, and deck metadata
- **Compiler** (`src/dsl/compiler.ts` — 700 lines): Spec → self-contained HTML with 20 layout functions, inline Canvas 2D chart JS (bar/line/pie/donut), KaTeX math integration, 8 themes with 12 CSS variables each, auto-fix engine for contrast and KPI overflow, Google Fonts injection, per-slide data-transition attributes, slide footer and speaker notes
- **Chart Renderer** (`src/renderers/ChartRenderer.tsx` — 130 lines): Pure Canvas 2D, zero dependencies — multi-dataset grouped bars with gradient fills, line charts with dot markers, pie/donut with percentage labels, legends, DPR-aware, theme-color-aware
- **Slide Renderer** (`src/renderers/SlideRenderer.tsx` — 350 lines): 20 dedicated layout renderers matching compiler output — title, section, quote, content, two-column, comparison, image-full, chart, math, KPI, big-number, dashboard, timeline, logo-grid, flowchart, agenda, team, progress, contact, blank
- **Browser Editor** (`src/editor/SpecEditor.tsx` — 430 lines): Visual kind picker grid with icons, per-block type editors (text/textarea, dynamic lists, image with Unsplash, chart, math), AI Rewrite for text blocks, duplicate/delete slides, raw JSON mode
- **AI Planner** (`src/ai/planner.ts` + `src/ai/ollama.ts`): Multi-backend (OpenRouter + Ollama) with backend selector UI, system prompt with full schema, fallback template generator, Ollama vision-to-deck pipeline
- **Validation Engine** (`src/validation/validator.ts`): 33 rules across structure, content, text, layout, charts, math, images, accessibility. Auto-repair at compile time
- **AI Design Critique** (`src/ai/design-ai.ts`): Slide content analysis via Ollama (text density, readability, contrast) with one-click auto-fix that rewrites the slide JSON
- **Theme Builder** (`src/components/ThemeBuilder.tsx`): Color pickers for 12 variables per theme, custom theme creation with localStorage persistence, Google Fonts selector (8 heading + 8 body)
- **Presentation Mode** (`src/components/PresentationMode.tsx`): Full-screen with keyboard navigation, slide counter, progress bar, CSS variable parity with compiler output
- **MCP Server** (`mcp-ollama/`): TypeScript SDK, stdio transport, 4 tools (generate, describe_image, list_models, create_demo_video)
- **Demo Pipeline** (`record-*.ts`): 5 scripts — Ollama narration generation, macOS TTS, Playwright screenshot/recording, FFmpeg compositing, vision QA
- **PPTX Export** (`src/publishing/pptx-exporter.ts`): Deck spec → PowerPoint with 8 themes, text, bullets, math, images
- **App Shell** (`src/App.tsx`): Undo/redo (Cmd+Z, 50 states), drag-and-drop slide reorder, theme CSS injection, Google Fonts dynamic loading, localStorage persistence
- **8 Sample Decks**: Showcase (23 slides, all 20 kinds), MedTech Series A (sage), SaaS Metrics (navy), Climate Report (crimson), NebulaDB pitch, Q4 Review, Conference Talk, Investor Update

### What I Reused
- **Reveal.js v6** (presentation framework, CDN — compiled HTML output)
- **KaTeX v0.16** (math rendering, CDN — compiled HTML output)
- **React v19 + Vite v8** (app framework and build tool)
- **Playwright v1.60** (headless Chromium for screenshots, recording, PDF)
- **FFmpeg v8** (video compositing — images + audio → MP4)
- **macOS TTS / `say`** (voiceover narration for demos)
- **Ollama** (llama3.2 for text generation, llama3.2-vision for image analysis)
- **OpenRouter API** (cloud AI fallback — GPT-4o, Claude)
- **@modelcontextprotocol/sdk v1.0** (MCP server framework)
- **pptxgenjs v4** (PPTX file generation)
- **Google Fonts** (Inter, Playfair Display, DM Serif Display, Lora, Space Grotesk)
- **picsum.photos / source.unsplash.com** (placeholder images, Unsplash search)

### What Broke and How I Debugged It
- **Reveal.js white theme CSS overrides**: The default Reveal.css white theme was overriding dark theme backgrounds. Fixed by adding explicit `!important` background declarations to all slide sections in the compiler CSS.
- **Playwright video recording producing 1-second files**: Vite's HMR websocket kept `networkidle` from ever resolving, causing the page load to timeout and the browser context to close early. Fixed by using static dist builds and `waitUntil: 'load'` instead of `'networkidle'`.
- **Canvas 2D chart rendering mismatch**: The React ChartRenderer was a simplified placeholder (single-bar, no legends, no gradients) while the compiler's inline JS was full-featured. Rewrote the ChartRenderer from scratch to match — added multi-dataset grouped bars, gradient fills, line/pie/donut support, legends, and DPR-aware rendering.
- **Theme contrast failures at 2:1 ratio**: Light themes (air, sage, bold) had secondary text colors (`tx2`) that failed WCAG AA (4.5:1 minimum) at ~2:1 contrast. Calculated proper ratios and darkened tx2 values: air #94a3b8→#475569 (5.1:1), sage #8a9e7a→#4a5a3f (5.0:1), bold #a3a3a3→#595959 (4.8:1).
- **Server base path (/slidelang/) mismatch**: Vite builds with `base: '/slidelang/'` producing asset URLs like `/slidelang/assets/index.js`, but the local static file server served from `dist/` root. Fixed by stripping the `/slidelang/` prefix in the HTTP server's URL handler.
- **Editor preview white vs dark theme background**: The slide preview container in App.tsx had hardcoded `background: 'white'` overriding the theme's background color. Changed to `background: 'var(--bg, white)'` and added the same to the Preivew area outer container.
- **CSS variable name mismatch (--sl-* vs --*)**: The theme injection used `--sl-bg`, `--sl-tx` etc. but the compiled HTML and SlideRenderer used unprefixed `--bg`, `--tx`. Removed the `--sl-` prefix everywhere for consistency across all three rendering surfaces (editor, presentation mode, compiled HTML).
- **App.tsx handler loss during rewrites**: Multiple edits caused `handleSpecChange`, `handleGenerate`, `handleRepair`, and `injectTheme` to be lost. Rebuilt the App component with all handlers, effects, and state properly ordered.
- **Ollama model not found**: The planner defaulted to `llama3.2` which wasn't pulled (only vision models existed). Pulled `llama3.2` (2GB) enabling full local AI generation.
- **Canvas tainting from SVG foreignObject**: Trying to capture the DOM as an image for vision critique produced "Tainted canvases may not be exported" errors. Replaced image-based critique with text-based analysis using the slide's JSON structure.
