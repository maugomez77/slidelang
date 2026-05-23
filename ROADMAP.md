# Slidelang - Capability Expansion Roadmap

Generated: 2026-05-22 | Based on deep research across AI presentation tools, Reveal.js ecosystem, MCP protocol, Ollama vision models, WCAG standards, and academic papers (SlideRL, PASS, SlideAudit).

---

## 1. AI & LLM Capabilities

### 1.1 Multi-Provider AI Backend (DONE)
- ✅ OpenRouter (GPT-4o, Claude, etc.)
- ✅ Ollama local models (llama3.2, qwen2.5, deepseek-r1, etc.)
- 🔜 **Anthropic direct API** — Claude models for higher quality spec generation
- 🔜 **Groq API** — ultra-fast inference for quick iterations
- 🔜 **Google Gemini** — native multimodal understanding for image-to-deck

### 1.2 Agentic Slide Generation (HIGH priority)
Based on the SlideRL paper (arXiv:2603.16839), which achieved 91.2% of Claude Opus quality with a 7B model:
- 🔜 **Iterative refinement loop** — Instead of one-shot generation, allow the LLM to research, plan, generate, then self-critique and revise slides
- 🔜 **Inverse specification reward** — Have the LLM attempt to recover the original prompt from generated slides as a quality signal
- 🔜 **Multi-turn editing** — Chat-like interface: "make slide 3 more sales-focused", "add a comparison table"
- 🔜 **Tool-use agents** — LLM can call tools during generation: search web for stats, fetch company logos, generate charts from CSV data

### 1.3 Content Enhancement
- 🔜 **AI rewriting** — Per-slide: "make this more concise", "adjust tone to executive", "translate to Spanish"
- 🔜 **Fact-checking** — Cross-reference claims in slides against web search results
- 🔜 **Audience adaptation** — Generate variants of the same deck for different audiences (investors vs. engineers vs. executives)
- 🔜 **Narrative/Story arc analysis** — AI reviews flow and suggests structural improvements

### 1.4 Voice & Speech
Based on PASS paper (arXiv:2501.06497) and Reveal.js TTS/speech plugins:
- 🔜 **Auto-generated speaker notes** — AI writes speaker notes for each slide
- 🔜 **Text-to-speech narration** — Generate audio narration per slide (Ollama + TTS models)
- 🔜 **Voice-controlled presentation** — Navigate slides via speech commands (reveal.js speech plugin)

---

## 2. Vision & Multimodal Capabilities (IN PROGRESS)

### 2.1 Image Understanding (PARTIAL)
- ✅ Ollama vision for describing images, checking contrast
- ✅ Image-to-deck generation (describe image → generate slides)
- 🔜 **Chart extraction from screenshots** — Upload a chart image, extract data programmatically
- 🔜 **OCR for slide content** — Extract text from images/screenshots to populate slides
- 🔜 **Design critique** — AI reviews slide mockups/screenshots and suggests improvements

### 2.2 Ollama Vision Models Available
| Model | Best For | Size |
|---|---|---|
| `llama3.2-vision:11b` | General image description, currently used | 11B |
| `llava:13b` / `llava:34b` | Higher quality, better text recognition | 13B-34B |
| `qwen3-vl:30b` / `qwen3-vl:235b` | State-of-the-art vision-language, chart understanding | 30B-235B |
| `gemma3:27b` | Multimodal, strong reasoning | 27B |
| `glm-ocr` | Specialized OCR for complex documents | - |
| `deepseek-ocr:3b` | Token-efficient OCR, fast | 3B |
| `nemotron3:33b` | Video + audio + vision + text, enterprise-grade | 33B |
| `medgemma:27b` | Medical image comprehension | 27B |

### 2.3 Vision QA Pipeline (to expand)
- 🔜 **Per-slide pre-flight check** — Before export, screenshot each slide, check: contrast, broken images, overlapping text, font rendering
- 🔜 **Brand compliance check** — Verify logo placement, brand colors, font usage
- 🔜 **Layout balance analysis** — Detect overcrowded slides, uneven whitespace distribution
- 🔜 **Accessibility audit via vision** — Check text size, color contrast, alt text presence

---

## 3. Reveal.js Plugin Integration Opportunities

### 3.1 High-Value Plugins (from 90+ community plugins)
- 🔜 **Auto-Animate** (built-in) — Smooth transitions between slides with matching elements
- 🔜 **Mermaid diagrams** — Text-to-diagram: flowcharts, sequence diagrams, ERDs, Gantt charts
- 🔜 **Chart.js** — Richer charts beyond Canvas 2D (doughnut, radar, polar, bubble)
- 🔜 **Chalkboard / Drawing** — Live annotation during presentations
- 🔜 **Poll / Q&A** — Interactive audience polling, live results on slides
- 🔜 **Audio Slideshow** — Sync audio narration with slide transitions
- 🔜 **Mapbox/Map integration** — Interactive maps for location-based presentations
- 🔜 **Spotlight / Pointer** — Laser pointer effects for remote presentations

### 3.2 New Slide Kinds (from community patterns)
These can be added to the schema and compiler:
- 🔜 **`interactive-poll`** — Embed live polls
- 🔜 **`mermaid`** — Text-based diagram rendering
- 🔜 **`code-demo`** — Live code execution/editing (RevealLiveCode)
- 🔜 **`map`** — Interactive map with markers
- 🔜 **`countdown`** — Timer for breaks, exercises
- 🔜 **`quiz`** — Multiple-choice quiz with scoring
- 🔜 **`wordcloud`** — Live word cloud generation

---

## 4. Collaboration & Real-Time Features

### 4.1 Multi-User Editing
- 🔜 **Shareable deck URLs** — Generate share links for collaborative editing
- 🔜 **Real-time co-editing** — Multiple users editing the same deck spec (CRDT-based)
- 🔜 **Comments & review** — Per-slide comments, approval workflow
- 🔜 **Version history** — Git-backed deck versioning with diff view

### 4.2 Remote Presentation
- 🔜 **Presenter mode** — Speaker view with notes, timer, next-slide preview
- 🔜 **Remote control** — Audience can follow along on their devices (Reveal.js multiplex)
- 🔜 **Live streaming overlay** — Integrate with streaming platforms
- 🔜 **Audience Q&A** — Collect questions during presentation, display on screen

---

## 5. Export & Distribution

### 5.1 Additional Export Formats
- ✅ HTML (self-contained, CDN-based)
- ✅ JSON (portable deck spec)
- ✅ Print (via Reveal.js PDF export)
- 🔜 **PDF export (decktape/puppeteer)** — High-quality PDF with proper pagination
- 🔜 **PPTX export** — Convert to PowerPoint for compatibility
- 🔜 **Google Slides import** — Push deck to Google Slides API
- 🔜 **Markdown export** — Slides as markdown for version control
- 🔜 **Video export** — Record presentation with auto-advance timers

### 5.2 Hosting & Sharing
- 🔜 **GitHub Pages deploy** — One-click deploy (partial: CI exists)
- 🔜 **Custom domain hosting** — Deploy to user's domain
- 🔜 **Embed mode** — iframe-embeddable slides for blogs/websites
- 🔜 **QR code sharing** — Generate QR code for instant mobile access

---

## 6. Accessibility (a11y) — HIGH Priority

### 6.1 WCAG 2.1 AA Compliance
- ✅ Contrast auto-fix in compiler (implemented)
- ✅ Vision-based contrast audit (implemented)
- 🔜 **Screen reader support** — ARIA labels, slide landmarks, proper heading hierarchy
- 🔜 **Keyboard navigation** — Full keyboard control (Reveal.js has basic support)
- 🔜 **Focus management** — Proper focus trapping in modals, skip navigation
- 🔜 **Alt text enforcement** — Require alt text for all images, AI-generated suggestions
- 🔜 **Color-blind safe palettes** — Theme variants for deuteranopia, protanopia, tritanopia
- 🔜 **Reduced motion mode** — Disable animations/transitions
- 🔜 **Font size controls** — User-adjustable text sizing

### 6.2 Reveal.js a11y Plugin
The existing `reveal-a11y` plugin by Marcy Sutton provides:
- Slide role/label announcements
- Focus management between slides
- Keyboard shortcuts for accessibility features
- 🔜 Integrate this plugin into compiled output

---

## 7. MCP Ecosystem Expansion

### 7.1 Current MCP Server (IN PROGRESS)
- ✅ `mcp-ollama` — Ollama text generation + vision via MCP stdio transport
- 🔜 **Streamable HTTP transport** — Support for remote/cloud MCP connections
- 🔜 **OAuth support** — Secure authentication for remote access
- 🔜 **Resources** — Expose slide templates, theme presets as MCP resources
- 🔜 **Prompts** — Expose prompt templates for common deck types as MCP prompts

### 7.2 MCP Integration Opportunities
- 🔜 **Slidelang MCP server for AI assistants** — Let Claude/Copilot generate and edit decks directly
- 🔜 **MCP tools for deck operations** — `create_deck`, `add_slide`, `edit_slide`, `export_deck`
- 🔜 **MCP resources** — Deck specs, themes, templates as resources AI assistants can read
- 🔜 **MCP client in slidelang** — The app can connect to other MCP servers (web search, data APIs)

### 7.3 Ecosystem Alignment
The MCP ecosystem is exploding (86k+ stars on the servers repo, 10k+ forks). Key trends:
- **Tool marketplaces** — Smithery, PulseMCP, MCP Repository, OpenTools
- **Hosted MCP** — mcp.run, Klavis, MCPVerse, mkinf
- **Enterprise gateways** — Webrix, MCPProxy, MCP Router with RBAC/SSO
- **Payment layers** — PayMCP for monetizing MCP tools

### 7.4 Potential Slidelang MCP Strategy
- **Community MCP server**: Submit to MCP Registry for discovery
- **Slidelang as platform**: Let other MCP clients generate decks through slidelang
- **Plugin MCP servers**: Specific-purpose servers (brand-kit, data-fetcher, image-finder)

---

## 8. Data & Live Content

### 8.1 Data Integration
- 🔜 **CSV/Excel import** — Drag data file, auto-generate charts and tables
- 🔜 **Live API data** — Fetch real-time data for KPI dashboards (stock prices, metrics)
- 🔜 **Database queries** — Connect to SQL databases, generate charts from query results
- 🔜 **Google Sheets integration** — Pull data from spreadsheets
- 🔜 **Notion/Airtable sync** — Import content structures from knowledge bases

### 8.2 Smart Content
- 🔜 **Auto-chart selection** — AI recommends the best chart type for given data
- 🔜 **Data storytelling** — AI generates narrative around data points
- 🔜 **Dynamic slides** — Slides that update when source data changes

---

## 9. Compiler & Schema Enhancements

### 9.1 Schema Extensions
- 🔜 **Animations** — Per-element entrance/exit animations (fade, slide, zoom)
- 🔜 **Transitions** — Per-slide transition effects (dissolve, wipe, flip)
- 🔜 **Conditional slides** — Show/hide slides based on audience, time, or data
- 🔜 **Slide variants** — Multiple versions of same slide for A/B testing
- 🔜 **Custom CSS injection** — Per-slide or per-element custom styles
- 🔜 **Font management** — Custom fonts, variable font axis control
- 🔜 **Video/Audio blocks** — Native media blocks with playback controls

### 9.2 Compiler Features
- ✅ Auto-fix engine (contrast, KPI sizing)
- ✅ Vision quality check (implemented)
- 🔜 **Bundle optimization** — Inline critical CSS, lazy-load non-critical assets
- 🔜 **Offline mode** — Bundle all CDN dependencies for offline presentations
- 🔜 **Minification** — Compress output for faster loading
- 🔜 **Chunked output** — Split large decks into multiple files for performance
- 🔜 **Asset pipeline** — Auto-optimize images, generate responsive variants

### 9.3 Validation Expansion
Based on SlideAudit dataset (arXiv:2508.03630) with 2400 annotated slides and 66-rule validators:
- 🔜 **Design flaw taxonomy** — Categorize issues: alignment, spacing, consistency, hierarchy
- 🔜 **AI-powered design critique** — Use LLM to identify design problems
- 🔜 **Style guide enforcement** — Define and enforce brand design tokens
- 🔜 **Accessibility validator** — Automated a11y checks in validator

---

## 10. Developer Experience & CLI

### 10.1 CLI Tools
- 🔜 **`slidelang init`** — Scaffold new deck project
- 🔜 **`slidelang compile`** — Compile deck spec to HTML/PDF/PPTX
- 🔜 **`slidelang serve`** — Live preview server with hot reload
- 🔜 **`slidelang validate`** — Lint/validate deck specs
- 🔜 **`slidelang deploy`** — Deploy to hosting (GitHub Pages, Netlify, Vercel)
- 🔜 **`slidelang vision-check`** — Run vision QA on compiled deck

### 10.2 CI/CD Integration
- 🔜 **GitHub Action** — Compile and deploy on push
- 🔜 **Pre-commit hook** — Validate deck specs before commit
- 🔜 **PR preview** — Deploy preview of deck changes for review

### 10.3 SDK / Library
- 🔜 **`@slidelang/core`** — Compiler as npm package for programmatic use
- 🔜 **`@slidelang/react`** — React components for embedding decks
- 🔜 **REST API** — Compile and manage decks via API

---

## 11. Competitive Landscape

### 11.1 Direct Competitors
| Tool | Approach | Differentiator |
|---|---|---|
| **Slides.com** | GUI editor, Reveal.js-based | Made by Reveal.js author, polished UX |
| **Gamma.app** | AI-generated decks, block-based | Consumer-friendly, limited customization |
| **Beautiful.ai** | AI design engine, auto-layout | Smart templates, enterprise focus |
| **Tome.app** | AI storytelling, narrative-first | Multimedia-rich, less structured |
| **Pitch.com** | Collaborative deck builder | Real-time collaboration, analytics |
| **Decktopus** | AI content + design | Form-based generation |

### 11.2 Slidelang Differentiators
| Feature | Slidelang | Competitors |
|---|---|---|
| **Deck-as-code / JSON spec** | ✅ Core | ❌ None |
| **Version control (git)** | ✅ Natural | ❌ Limited |
| **Self-hosted, no vendor lock-in** | ✅ | ❌ SaaS only |
| **Local AI (Ollama)** | ✅ | ❌ Cloud-only |
| **Multi-backend AI** | ✅ | ❌ Single provider |
| **Vision quality checks** | ✅ | ❌ None |
| **MCP integration** | ✅ | ❌ None |
| **Open source** | ✅ | ❌ Few |
| **20 slide kinds** | ✅ | ❌ Limited |
| **Canvas 2D charts (no deps)** | ✅ | ❌ Library-dependent |
| **Programmatic generation** | ✅ | ❌ Manual/GUI |

---

## 12. Prioritized Implementation Roadmap

### Phase 1: Foundation Strengthening (NOW)
- [x] Theme contrast fixes (air, sage, bold)
- [x] Ollama MCP server
- [x] Ollama backend integration in app
- [x] Vision-based contrast checking
- [ ] Mermaid diagram slide kind
- [ ] Offline bundle mode
- [ ] Screen reader / basic a11y
- [ ] `reveal-a11y` plugin integration

### Phase 2: AI Power-Up (NEXT)
- [ ] Agentic multi-turn deck editing (chat interface)
- [ ] AI speaker notes generation
- [ ] Content rewriting per slide
- [ ] Design critique AI (SlideAudit-inspired)
- [ ] Multi-model vision pipeline (qwen3-vl for charts, glm-ocr for text, llama3.2-vision for general)
- [ ] Brand compliance checker

### Phase 3: Collaboration & Distribution
- [ ] Shareable URLs with real-time co-editing
- [ ] PDF export (decktape/puppeteer)
- [ ] PPTX export
- [ ] Presenter/speaker view
- [ ] Version history & diff
- [ ] GitHub Pages one-click deploy

### Phase 4: Platform & Ecosystem
- [ ] Slidelang MCP server (for AI assistants to generate decks)
- [ ] CLI tools (`init`, `compile`, `serve`, `deploy`)
- [ ] `@slidelang/core` npm package
- [ ] CI/CD GitHub Action
- [ ] REST API for deck management
- [ ] Plugin system for community extensions

---

## 13. Key Academic References

| Paper | Year | Key Finding |
|---|---|---|
| **SlideRL** (2603.16839) | 2026 | RL-trained 7B model achieves 91.2% of Claude Opus quality for slide generation |
| **SlideAudit** (2508.03630) | 2025 | 2400-slide dataset with design flaw taxonomy; LLMs struggle (F1 0.33-0.66) |
| **PASS** (2501.06497) | 2025 | Pipeline for document→slides→speech; LLM evaluation metrics for presentations |
| **DualSlide** (2304.12506) | 2023 | Sketch-based slide design with layout retrieval and guidance |
| **Layout-Corrector** (2409.16689) | 2024 | Diffusion model for detecting and fixing inharmonious layouts |

---

## 14. Immediate Actions (This Sprint)

1. **Integrate `reveal-a11y` plugin** into compiled output
2. **Add `mermaid` slide kind** — text-to-diagram in slides
3. **Multi-model vision** — add model selector to vision check (qwen3-vl for charts)
4. **Offline bundle mode** — inline CDN deps for offline presentations
5. **AI speaker notes** — generate per-slide speaker notes via Ollama
6. **Keyboard navigation audit** — ensure full keyboard accessibility
