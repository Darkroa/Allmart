import OpenAI from "openai";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

export type ProviderName = "groq" | "github" | "nvidia" | "openai";

export interface Provider {
  name: ProviderName;
  /** Human-readable label shown in the UI */
  label: string;
  /** Default model to use with this provider */
  model: string;
  /** Base URL for the OpenAI-compatible API */
  baseURL: string;
  /** Name of the env var that holds the API key */
  apiKeyEnv: string;
}

export const PROVIDERS: Provider[] = [
  {
    name: "groq",
    label: "Groq Cloud",
    model: "llama-3.3-70b-versatile",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
  },
  {
    name: "github",
    label: "GitHub Models",
    model: "gpt-4o",
    baseURL: "https://models.inference.ai.azure.com",
    apiKeyEnv: "GITHUB_TOKEN",
  },
  {
    name: "nvidia",
    label: "NVIDIA NIM",
    model: "meta/llama-3.1-70b-instruct",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKeyEnv: "NVIDIA_API_KEY",
  },
  {
    name: "openai",
    label: "OpenAI",
    model: "gpt-4o",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKeyEnv: "AI_INTEGRATIONS_OPENAI_API_KEY",
  },
];

/** Returns providers whose API key env var is set and non-empty. */
export function getAvailableProviders(): Provider[] {
  return PROVIDERS.filter((p) => {
    const key = process.env[p.apiKeyEnv];
    return typeof key === "string" && key.trim().length > 0;
  });
}

/** Serialised info safe to send to the client. */
export function serializeProvider(p: Provider) {
  return { name: p.name, label: p.label, model: p.model };
}

// ---------------------------------------------------------------------------
// Client factory — do NOT cache; keys may change between restarts.
// ---------------------------------------------------------------------------

export function createClient(provider: Provider): OpenAI {
  const apiKey = process.env[provider.apiKeyEnv]!;
  return new OpenAI({
    apiKey,
    baseURL: provider.baseURL,
    // GitHub Models requires an extra header
    defaultHeaders:
      provider.name === "github"
        ? { "api-version": "2024-07-01-preview" }
        : undefined,
  });
}

// ---------------------------------------------------------------------------
// Chat completion with automatic provider fallback
// ---------------------------------------------------------------------------

export interface CompletionResult {
  completion: OpenAI.ChatCompletion;
  provider: Provider;
}

/**
 * Tries providers in order (highest priority first) until one succeeds.
 * Throws if all available providers fail.
 */
export async function chatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  tools: OpenAI.ChatCompletionTool[],
): Promise<CompletionResult> {
  const available = getAvailableProviders();

  if (available.length === 0) {
    throw new Error(
      "No LLM provider configured. " +
        "Add at least one of GROQ_API_KEY, GITHUB_TOKEN, or NVIDIA_API_KEY in Replit Secrets.",
    );
  }

  let lastErr: unknown;

  for (const provider of available) {
    try {
      const client = createClient(provider);

      const completion = await client.chat.completions.create({
        model: provider.model,
        messages,
        ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
        max_tokens: 1200,
        // Groq doesn't support parallel tool calls flag; other providers ignore it when absent
        ...(provider.name === "groq" ? {} : {}),
      });

      logger.info(
        { provider: provider.name, model: provider.model },
        "LLM completion succeeded",
      );
      return { completion, provider };
    } catch (err) {
      logger.error(
        { err, provider: provider.name, model: provider.model },
        "LLM provider failed — trying next",
      );
      lastErr = err;
    }
  }

  throw lastErr ?? new Error("All LLM providers failed");
}
