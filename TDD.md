# Slidelang — Technical Design Document

## Deck Spec Schema (`src/dsl/schema.ts`)
A typed TypeScript schema defines the deck specification:

- **DeckSpec**: `{ meta: DeckMeta, slides: Slide[] }`
- **Slide**: `{ kind: SlideKind, title?, subtitle?, blocks: SlideBlock[], background?, notes?, layoutIssues? }`
- **SlideKind**: 10 variants — `title`, `section`, `content`, `two-column`, `image-full`, `quote`, `comparison`, `chart`, `math`, `blank`
- **SlideBlock**: Union of `TextBlock`, `ListBlock` (bullets/numbered), `ChartBlock`, `MathBlock`, `ImageBlock`
- **TextStyle**: Optional bold, italic, size (small-xlarge), color, alignment
- **ChartBlock**: Supports bar/line/pie/area with labels and datasets
- **ThemePreset**: 5 themes — default, dark, minimal, gradient, corporate

The schema is the single source of truth. All tooling (compiler, editor, validator, AI planner) operates on this schema.

## Compiler Architecture (`src/dsl/compiler.ts`)
The compiler transforms a DeckSpec into a self-contained HTML document:

```
DeckSpec → compileDeckToHTML() → string (full HTML page)
```

- Inlines CSS variables from the selected theme
- Maps slide kinds to layout templates (title center, two-column grid, comparison grid, image-full)
- Inlines chart rendering as <canvas> with inline JavaScript using the Canvas 2D API
- Uses KaTeX from CDN for math rendering
- Uses Reveal.js 5 from CDN for presentation controls
- Generates validation badges directly in slide markup

## AI Planning (`src/ai/planner.ts`)
Converts a natural language prompt to a DeckSpec:

```
prompt → planDeck() → DeckSpec
```

- Calls OpenRouter API with a system prompt that defines the schema
- Requests JSON response format for deterministic parsing
- Validates and fills defaults on the returned spec
- Falls back to a built-in template generator when no API key is configured
- Fallback generates 6-7 slides with chart, math, image, comparison, and content slides
- API key and model stored in localStorage (client-side only)

## Browser Editor State Model (`src/editor/SpecEditor.tsx`)
The editor operates on a single DeckSpec held in React state:

- **SpecEditor**: Tabbed navigation by slide index. Each slide is independently editable.
- **SlideEditor**: Per-slide form with kind selector, title/subtitle inputs, background picker, and block list.
- **BlockEditor**: Each block type has a custom editor:
  - Text: textarea + style toggles (bold, italic, size)
  - Lists: dynamic item array with add/remove
  - Chart: type selector, label preview
  - Math: LaTeX expression input
  - Image: URL + alt text inputs
- **RawSpecEditor**: Full JSON textarea with validation and apply button
- State persists to localStorage on every change

## Validation & Repair Pipeline (`src/validation/validator.ts`)
Two-pass pipeline:

### Validation Pass
Rules checked per slide:
- Empty content blocks (warning)
- Block count > 8 (warning — overflow risk)
- Text > 500 chars (warning — truncation risk)
- List items > 15 (warning — overflow risk)
- List item > 200 chars (info — wordiness)
- Chart with no labels/values (error — missing data)
- Chart labels > 20 (warning — crowding)
- Empty math expression (warning)
- Missing image URL (error — broken asset)
- Non-HTTP image URL (warning — may not load)
- Custom background with text (info — contrast check)

### Repair Pass
- Removes empty text blocks and empty lists
- Adds placeholder text to empty slides
- Injects "No Data" placeholder into charts with missing data
- Returns list of repair actions taken

## Chart/Math/Image Rendering

### Charts (`src/renderers/ChartRenderer.tsx`)
- Renders bar charts using the Canvas 2D API
- Supports multi-dataset overlays with semi-transparent colors
- Auto-sizes to container width with device pixel ratio support
- Y-axis gridlines and labels auto-scaled to data range
- No external charting library — lightweight, fast, deterministic

### Math (`src/renderers/MathRenderer.tsx`)
- Renders LaTeX expressions using KaTeX
- Lazy-loads KaTeX from CDN on first use
- Falls back to raw LaTeX display if KaTeX fails to load
- Supports both inline ($...$) and display ($$...$$) modes

### Images (`src/renderers/ImageRenderer.tsx`)
- Renders <img> with max-height constraints
- Graceful fallback on load error (shows placeholder text)

## Publishing Flow (`src/publishing/publisher.ts`)
Three export paths:
1. **HTML export** — compileDeckToHTML → Blob → download (.html)
2. **JSON export** — serialized DeckSpec → download (.slidelang.json)
3. **Print** — open compiled HTML in new tab → window.print()
4. **Presentation URL** — compiled HTML → object URL for live preview

## CLI / Plugin Integration (Future)
- The compiler is a pure function (DeckSpec → string), making it trivially usable from Node.js CLI
- The schema is fully typed, enabling language server plugins (VS Code extension for .slidelang.json)
- Planned: `slidelang build spec.json` CLI command and GitHub Action for automated deck generation
