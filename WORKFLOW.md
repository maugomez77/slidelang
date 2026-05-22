# Slidelang — Workflow Samples

This document demonstrates the end-to-end workflow: **Prompt → Spec → Edit → Validate → Repair → Compile**, showing every primitive (chart, math, image) in action.

---

## Workflow 1: AI-Assisted Generation from Prompt

### Step 1 — Prompt intake

User types into the browser editor:

```
A Q3 2025 product review deck for NebulaDB. Cover adoption growth, revenue split by region,
margin formula, and next-quarter roadmap. Use a dark theme.
```

### Step 2 — AI generates a structured DeckSpec

The AI planner (`src/ai/planner.ts`) calls OpenRouter. The LLM returns valid JSON matching the schema.

If no API key is configured, the built-in fallback generates a template deck instead — same schema, just without domain-specific content.

### Step 3 — The resulting spec (editable, inspectable JSON)

```json
{
  "meta": {
    "title": "NebulaDB Q3 2025 Review",
    "author": "Product Team",
    "theme": "dark",
    "date": "2025-10-01"
  },
  "slides": [
    {
      "kind": "title",
      "title": "NebulaDB Q3 2025 Review",
      "subtitle": "Adoption · Revenue · Roadmap",
      "blocks": [
        {
          "type": "text",
          "content": "Prepared by the Product Team",
          "style": { "italic": true, "size": "large" }
        }
      ]
    },
    {
      "kind": "content",
      "title": "Adoption Growth",
      "blocks": [
        {
          "type": "text",
          "content": "NebulaDB saw 340% YoY active instance growth across all tiers.",
          "style": { "size": "large" }
        },
        {
          "type": "bullets",
          "items": [
            "Enterprise tier: +210% (focused on F500 accounts)",
            "Pro tier: +380% (SMB and startup adoption)",
            "Free tier: +460% (open-source community)"
          ]
        }
      ]
    },
    {
      "kind": "chart",
      "title": "Revenue Split by Region",
      "blocks": [
        {
          "type": "chart",
          "chartType": "bar",
          "title": "Q3 Revenue by Region ($M)",
          "labels": ["NA", "EMEA", "APAC", "LATAM"],
          "datasets": [
            { "label": "Enterprise", "values": [14.2, 9.8, 7.5, 3.1], "color": "#4cc9f0" },
            { "label": "SMB", "values": [8.5, 5.2, 4.1, 2.0], "color": "#f72585" }
          ]
        }
      ]
    },
    {
      "kind": "math",
      "title": "Margin Formula",
      "blocks": [
        {
          "type": "math",
          "expression": "\\text{Gross Margin} = \\frac{\\text{Revenue} - \\text{COGS}}{\\text{Revenue}} \\times 100\\%"
        },
        {
          "type": "math",
          "expression": "\\text{LTV} = \\frac{\\text{ARPU}}{\\text{Churn Rate}}"
        },
        {
          "type": "text",
          "content": "Q3 gross margin: 72% (up from 68% in Q2). LTV improved from $48K to $62K.",
          "style": { "size": "medium", "italic": true }
        }
      ]
    },
    {
      "kind": "comparison",
      "title": "Q3 vs Q2 Performance",
      "blocks": [
        {
          "type": "text",
          "content": "Q2 2025",
          "style": { "bold": true, "size": "xlarge" }
        },
        {
          "type": "bullets",
          "items": [
            "Revenue: $18.2M",
            "Active instances: 2,400",
            "Churn: 4.2%",
            "NPS: 62"
          ]
        },
        {
          "type": "text",
          "content": "Q3 2025",
          "style": { "bold": true, "size": "xlarge" }
        },
        {
          "type": "bullets",
          "items": [
            "Revenue: $24.6M",
            "Active instances: 8,160",
            "Churn: 2.8%",
            "NPS: 74"
          ]
        }
      ]
    },
    {
      "kind": "image-full",
      "title": "Product Architecture Overview",
      "blocks": [
        {
          "type": "image",
          "source": {
            "url": "https://picsum.photos/seed/nebula/800/400",
            "alt": "NebulaDB architecture diagram",
            "caption": "Multi-region distributed database architecture"
          }
        }
      ]
    },
    {
      "kind": "content",
      "title": "Q4 Roadmap",
      "blocks": [
        {
          "type": "numbered",
          "items": [
            "Vector search GA release (Nov)",
            "Multi-master replication (Dec)",
            "SOC 2 Type II certification",
            "Partner marketplace launch",
            "Free tier capacity increase to 5GB"
          ]
        }
      ]
    }
  ]
}
```

**Key point**: This is not a generated slide image or fixed HTML. It's a structured, typed JSON spec. Every slide, block, and style value is individually addressable.

---

## Workflow 2: Validate & Repair

### Step 4 — Run validation

The validator (`src/validation/validator.ts`) runs 14 checks automatically on every change:

**Validation triggers**: A 6-slide deck with intentional problems (empty blocks, missing data, overlaps):

```
Input spec problems:
  Slide 1: clean (title slide)
  Slide 2: clean (chart slide)
  Slide 3: clean (math slide)
  Slide 4: empty bullets block, empty text block, 600-char text block
  Slide 5: image with missing URL
  Slide 6: two text blocks sharing the same x:2,y:2 position
```

Actual validator output (`validateDeck()`):

```
  [warning] empty_content:    List has no items
  [warning] empty_content:    Text block is empty
  [warning] text_truncation:  Text block exceeds 500 chars, may overflow slide
  [error]   missing_image:    Image has no URL
  [warning] overlap:          Block 1 overlaps with block 2
```

### Step 5 — Auto-repair

Calling `repairDeck()` produces:

```
  Slide 4: Removed empty bullets list
  Slide 4: Removed empty text block
```

Empty blocks filtered. The overlap, missing image, and truncation warnings remain — the repair engine removes clearly broken blocks but leaves layout decisions to the user.

---

## Workflow 3: Spatial Layout with Primitives

### Step 6 — Edit spec to use spatial positioning

User edits a slide in the browser editor to place chart and text side-by-side:

```json
{
  "kind": "content",
  "title": "Dashboard View",
  "blocks": [
    {
      "type": "text",
      "content": "🟢 System Status: Healthy",
      "style": { "bold": true, "size": "xlarge" },
      "position": { "x": 3, "y": 2, "width": 50 }
    },
    {
      "type": "chart",
      "chartType": "bar",
      "title": "QPS by Hour",
      "labels": ["00:00","04:00","08:00","12:00","16:00","20:00"],
      "datasets": [
        { "label": "QPS", "values": [850, 420, 2100, 3800, 4100, 2200], "color": "#4361ee" }
      ],
      "position": { "x": 3, "y": 12, "width": 47, "height": 55 }
    },
    {
      "type": "text",
      "content": "P99 Latency",
      "style": { "bold": true, "size": "large" },
      "position": { "x": 55, "y": 2, "width": 42 }
    },
    {
      "type": "math",
      "expression": "\\text{P99} = 7.3\\text{ms}",
      "position": { "x": 55, "y": 14, "width": 42 }
    },
    {
      "type": "bullets",
      "items": [
        "Read: 3.1ms",
        "Write: 12.4ms",
        "Replication: 0.8ms"
      ],
      "position": { "x": 55, "y": 30, "width": 42 }
    }
  ]
}
```

### Validation on spatial layout

The validator detects an overlap if positions collide:

```
⚠️ Block 4 (math) overlaps with block 5 (bullets)
```

User adjusts `y` values in the editor to fix, or runs auto-repair (human-level decision for overlaps — the repair engine warns but doesn't auto-move elements).

---

## Workflow 4: Compilation & Preview

### Step 7 — Browser renders live preview

`SlideRenderer.tsx` renders each slide in the right panel in real-time as the spec is edited:

| Primitive | Renderer | Input |
|-----------|----------|-------|
| **Chart** | `ChartRenderer.tsx` (Canvas 2D API) | `{ type: "chart", chartType: "bar", labels: [...], datasets: [...] }` |
| **Math** | `MathRenderer.tsx` (KaTeX) | `{ type: "math", expression: "\\frac{a}{b}" }` |
| **Image** | `ImageRenderer.tsx` (HTML img) | `{ type: "image", source: { url: "...", alt: "..." } }` |
| **Text** | Inline in `SlideRenderer.tsx` | `{ type: "text", content: "...", style: {...} }` |
| **Lists** | Inline in `SlideRenderer.tsx` | `{ type: "bullets", items: [...] }` |

Spatial blocks render as `position: absolute` at x/y coordinates. Non-spatial blocks stack vertically.

### Step 8 — Export as self-contained HTML

Clicking **Export HTML** calls `compileDeckToHTML()` → downloads a standalone `.html` file.

The file contains:
- Inline CSS variables from the selected theme
- Full Reveal.js presentation structure
- Inline Canvas chart rendering code (no chart library dependency)
- KaTeX CDN link for math (loaded at runtime)

```bash
# Example: what the compiled slide looks like in the HTML
<section>
  <h2>Dashboard View</h2>
  <div style="position:absolute;left:3%;top:2%;width:50%;">
    <p class="block-text xlarge" style="font-weight:bold;">System Status: Healthy</p>
  </div>
  <div style="position:absolute;left:3%;top:12%;width:47%;height:55%;">
    <div class="block-chart"><canvas id="chart-abc123"></canvas></div>
    <script><!-- inline bar chart drawing code --></script>
  </div>
  <div style="position:absolute;left:55%;top:14%;width:42%;">
    <div class="block-math">$$\text{P99} = 7.3\text{ms}$$</div>
  </div>
</section>
```

---

## Workflow 5: Iterate Without Re-prompting

### The key advantage of structured authoring

Unlike prompt-to-static-slides tools:

1. **Edit without re-prompting**: Change a chart value from `14.2` to `15.7` by editing the number in the spec editor — preview updates instantly. No AI reroll.

2. **Add a slide mid-deck**: Click `+ Add Slide` in the editor, pick a kind, fill in blocks. No regenerating the entire deck.

3. **Tweak layout visually**: Adjust `position.x` or `position.y` in the spec editor. Slide preview reflows live.

4. **Validation runs continuously**: Every keystroke triggers `validateDeck()`. Issues appear in the validation panel immediately.

5. **Export paths are independent**: Same spec exports as HTML presentation, printable PDF (browser print), or raw `.slidelang.json` for version control.

---

## Summary: The Full Pipeline

```
                    ┌─────────────┐
   User prompt ───▶ │ AI Planner  │ ───▶ DeckSpec (structured JSON)
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Validator  │ ◀── runs 14 checks on every change
                    └─────────────┘
                     │          │
                     ▼          ▼
              issues found   passes clean
                     │
                     ▼
                    ┌─────────────┐
                    │  Auto-repair │ ─── removes empty blocks, fixes missing data
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
   JSON spec ◀────▶ │  Spec Editor │ ─── live preview in right panel
  (editable)        └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Compiler   │ ─── DeckSpec → Reveal.js HTML
                    └─────────────┘
                     │    │    │
                     ▼    ▼    ▼
                 HTML  JSON  Print
```

**Artifacts demonstrated**: prompt-to-spec, chart rendering (Canvas), math rendering (KaTeX), image primitives, spatial layout, validation catch, auto-repair, spec-as-source editability, multi-format export.
