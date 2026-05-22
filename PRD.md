# Slidelang — Product Requirements Document

## Problem
Teams using AI for slide generation get static, brittle output that is hard to edit. Current tools produce prompt-to-slide output that breaks on regeneration, lacks structured data (charts, math, images), and offers no validation or repair. Users spend more time fighting the output than creating the deck.

## Target User & Workflow
**Primary**: Knowledge workers who build recurring business decks (quarterly reviews, pitch decks, technical talks) and want AI assistance without losing editability.

**Workflow**: Prompt → Structured spec → Editable slides → Review & repair → Publish

## Why Structured Authoring Beats Prompt-to-Static-Slides
1. **Deterministic spec**: The deck spec (YAML-like JSON) is the source of truth. AI generates the spec, not the final pixels.
2. **Editability**: Users edit the spec directly or through the browser editor. Changes are tracked, predictable, and do not require re-prompting.
3. **Validation**: The spec is validated against layout rules before compilation. Issues are flagged and auto-repaired.
4. **Composability**: Blocks (text, bullets, charts, math, images) compose into slides. Reordering or changing a block does not break others.

## Trustworthiness & Editability
- **Spec-as-source**: The JSON spec is inspectable, versionable, and shareable independent of the rendered output.
- **Browser editor**: WYSIWYG-style editing of the spec with live preview. No rerolling.
- **Validation panel**: Errors and warnings shown inline with auto-repair.
- **Multiple export paths**: Export as standalone HTML presentation (Reveal.js), JSON spec, or print.

## Depth Areas
1. **DSL Design**: Typed deck spec schema with 10 slide kinds, 6 block types, and layout metadata.
2. **Compiler Architecture**: Compiles spec → self-contained Reveal.js HTML with inline chart canvas rendering and KaTeX math.
3. **Layout Validation**: Rule-based validation engine that checks overflow, empty content, missing chart data, missing images, text truncation, and color contrast. Auto-repair removes empty blocks and adds placeholders.
4. **Chart/Math Rendering**: Bar charts rendered via Canvas API with no external charting library dependency. Math rendered via KaTeX with local or CDN loading.
5. **AI Integration**: OpenRouter-backed LLM planner that converts natural language prompts into valid deck specs, with fallback template generation when no API key is configured.

## Wedge & Platform Path
The wedge is recurring business and technical decks (quarterly reviews, pitch decks, conference talks). From there, the platform expands to:

1. Team collaboration on deck specs (shared specs, review workflows)
2. Deck template marketplace (reusable spec templates by industry)
3. Live data binding (charts pulling from APIs, databases)
4. Plugin system (custom block types, custom validators, custom renderers)
5. CLI tool for CI/CD deck generation

## Success Metrics
- Time from prompt to publishable deck < 5 minutes
- Validation catches > 90% of common layout issues
- Spec compilation to HTML in < 1 second
- Zero external dependencies for core rendering (charts, layout)
