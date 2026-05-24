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
