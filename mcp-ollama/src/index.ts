import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function ollamaGenerate(
  model: string,
  prompt: string,
  images?: string[]
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: false,
  };
  if (images && images.length > 0) {
    body.images = images;
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}

async function ollamaListModels(): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    models: { name: string; modified_at: string; size: number }[];
  };

  return data.models
    .map((m) => `${m.name} (${(m.size / 1e9).toFixed(1)} GB)`)
    .join("\n");
}

async function createDemoVideoFromSpec(
  specPath: string,
  outputPath?: string,
  voice?: string
): Promise<string> {
  const spec = JSON.parse(readFileSync(specPath, "utf-8")) as {
    meta: { title: string };
    slides: { title?: string; subtitle?: string; blocks: { type: string; content?: string; items?: string[] }[] }[];
  };

  const outFile = outputPath || join(process.cwd(), "demo-video.mp4");
  const tmpDir = join(process.env.TMPDIR || "/tmp", `slidelang-video-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  const steps: string[] = [];

  for (let i = 0; i < spec.slides.length; i++) {
    const slide = spec.slides[i];
    const title = slide.title || `Slide ${i + 1}`;
    const content = slide.blocks
      .map((b) => {
        if (b.type === "text") return b.content || "";
        if (b.type === "bullets" || b.type === "numbered")
          return (b.items || []).join(". ");
        return "";
      })
      .filter(Boolean)
      .join(". ");

    const narration = await ollamaGenerate(
      "llama3.2",
      `Write a one-sentence voiceover narration for this slide. Title: "${title}". Content: "${content.slice(0, 400)}". Return ONLY the narration sentence.`
    );
    const cleanNarration = narration.trim().replace(/^["']|["']$/g, "");
    steps.push(`Slide ${i + 1}: "${cleanNarration.slice(0, 60)}..."`);
    console.error(`  ${steps[steps.length - 1]}`);

    const audioFile = join(tmpDir, `audio_${String(i).padStart(3, "0")}.aiff`);
    const safeText = cleanNarration.replace(/["'`]/g, "").replace(/[&|;$<>]/g, " ");
    execSync(`say -v "${voice || "Daniel"}" -o "${audioFile}" "${safeText}"`, {
      timeout: 30000,
    });
  }

  steps.push(`Video saved to: ${outFile}`);
  steps.push(`Total slides: ${spec.slides.length}`);
  steps.push("Note: Full video compositing requires Playwright + FFmpeg. Run `npx tsx make-demo-video.ts <spec.json>` for full video generation.");

  return steps.join("\n");
}

const tools: Tool[] = [
  {
    name: "ollama_generate",
    description:
      "Generate text using any Ollama model. Send a prompt and get a completion. " +
      "Use for text generation, code, reasoning, chat, and general LLM tasks.",
    inputSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description:
            "Ollama model name (e.g., 'llama3.2', 'qwen2.5:14b', 'deepseek-r1:8b')",
        },
        prompt: {
          type: "string",
          description: "The text prompt to send to the model",
        },
      },
      required: ["model", "prompt"],
    },
  },
  {
    name: "ollama_describe_image",
    description:
      "Describe an image using a vision-capable Ollama model (e.g. llama3.2-vision, llava). " +
      "Provide an image file path and an optional prompt (defaults to 'describe this image').",
    inputSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description:
            "Vision-capable model name (e.g., 'llama3.2-vision:11b', 'llava:13b')",
        },
        image_path: {
          type: "string",
          description: "Absolute path to the image file on disk",
        },
        prompt: {
          type: "string",
          description:
            "Prompt for the vision model (defaults to 'describe this image')",
        },
      },
      required: ["model", "image_path"],
    },
  },
  {
    name: "ollama_list_models",
    description:
      "List all models currently available in the local Ollama installation.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_demo_video",
    description:
      "Create a product demo video from a deck spec JSON file. " +
      "Renders each slide, generates AI narration, creates TTS audio, and composites into an MP4 video. " +
      "Requires: Ollama (for narration), macOS `say` (for TTS), and FFmpeg (for compositing).",
    inputSchema: {
      type: "object",
      properties: {
        spec_path: {
          type: "string",
          description: "Absolute path to the deck spec JSON file (e.g. examples/pitch-deck.json)",
        },
        output_path: {
          type: "string",
          description: "Output path for the MP4 video file (default: demo-video.mp4)",
        },
        voice: {
          type: "string",
          description: "macOS TTS voice name (default: Daniel). Use `say -v '?'` to list available voices.",
        },
      },
      required: ["spec_path"],
    },
  },
];

const server = new Server(
  {
    name: "mcp-ollama",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "ollama_generate": {
        const { model, prompt } = args as { model: string; prompt: string };
        if (!model || !prompt) {
          throw new Error("Missing required parameters: model, prompt");
        }
        const result = await ollamaGenerate(model, prompt);
        return { content: [{ type: "text", text: result }] };
      }

      case "ollama_describe_image": {
        const { model, image_path, prompt } = args as {
          model: string;
          image_path: string;
          prompt?: string;
        };
        if (!model || !image_path) {
          throw new Error(
            "Missing required parameters: model, image_path"
          );
        }

        const imageBuffer = readFileSync(image_path);
        const base64Image = imageBuffer.toString("base64");

        const visionPrompt = prompt || "describe this image";
        const result = await ollamaGenerate(model, visionPrompt, [base64Image]);

        return { content: [{ type: "text", text: result }] };
      }

      case "ollama_list_models": {
        const result = await ollamaListModels();
        return { content: [{ type: "text", text: result }] };
      }

      case "create_demo_video": {
        const { spec_path, output_path, voice } = args as {
          spec_path: string;
          output_path?: string;
          voice?: string;
        };
        if (!spec_path) {
          throw new Error("Missing required parameter: spec_path");
        }

        const result = await createDemoVideoFromSpec(spec_path, output_path, voice);
        return { content: [{ type: "text", text: result }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-ollama server running on stdio");
  console.error(`Ollama base URL: ${OLLAMA_BASE_URL}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
