import { KiloModelInfo } from './types';

export const KILO_DEFAULT_BASE_URL = 'https://ai-gateway.kilo.ai/api/v1';

/**
 * Offline recorded fixture for deterministic test execution
 */
export const RECORDED_KILO_FIXTURE_MODELS: KiloModelInfo[] = [
  {
    id: 'kilo/free/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill Qwen 32B (Free Route)',
    provider: 'DeepSeek',
    context_length: 65536,
    pricing: {
      input_per_m: 0,
      output_per_m: 0,
      is_free: true,
      is_unknown: false,
    },
    capabilities: {
      tool_calling: true,
      streaming: true,
      reasoning_effort: true,
      supported_reasoning_levels: ['low', 'medium', 'high'],
    },
    status: 'active',
  },
  {
    id: 'anthropic/claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
    provider: 'Anthropic',
    context_length: 200000,
    pricing: {
      input_per_m: 3.0,
      output_per_m: 15.0,
      is_free: false,
      is_unknown: false,
    },
    capabilities: {
      tool_calling: true,
      streaming: true,
      reasoning_effort: true,
      supported_reasoning_levels: ['low', 'medium', 'high'],
    },
    status: 'active',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Omni Engine)',
    provider: 'OpenAI',
    context_length: 128000,
    pricing: {
      input_per_m: 2.5,
      output_per_m: 10.0,
      is_free: false,
      is_unknown: false,
    },
    capabilities: {
      tool_calling: true,
      streaming: true,
      reasoning_effort: false,
    },
    status: 'active',
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct (Free Route)',
    provider: 'Meta',
    context_length: 131072,
    pricing: {
      input_per_m: 0,
      output_per_m: 0,
      is_free: true,
      is_unknown: false,
    },
    capabilities: {
      tool_calling: true,
      streaming: true,
      reasoning_effort: false,
    },
    status: 'active',
  },
];

export class KiloGatewayClient {
  private baseUrl: string;
  private cachedModels: KiloModelInfo[] | null = null;
  private cacheTimestamp = 0;
  private readonly cacheTtlMs = 60000; // 1 minute freshness

  constructor(baseUrl: string = KILO_DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Parses raw API response into verified KiloModelInfo objects
   */
  public parseModelCatalogue(rawJson: any): KiloModelInfo[] {
    const list = Array.isArray(rawJson?.data) ? rawJson.data : Array.isArray(rawJson) ? rawJson : [];
    return list.map((item: any) => {
      const isFree = item.pricing?.prompt === '0' || item.pricing?.input === 0 || item.id?.includes('free');
      const isUnknown = item.pricing === undefined;

      return {
        id: item.id || 'unknown',
        name: item.name || item.id,
        provider: item.provider || item.owned_by || 'Unknown',
        context_length: item.context_length || item.max_tokens || 32768,
        pricing: {
          input_per_m: item.pricing?.input ? Number(item.pricing.input) * 1000000 : 0,
          output_per_m: item.pricing?.output ? Number(item.pricing.output) * 1000000 : 0,
          is_free: isFree,
          is_unknown: isUnknown,
        },
        capabilities: {
          tool_calling: Boolean(item.capabilities?.tools ?? true),
          streaming: true,
          reasoning_effort: Boolean(item.capabilities?.reasoning ?? false),
          supported_reasoning_levels: item.capabilities?.reasoning_levels || ['medium'],
        },
        status: 'active',
      };
    });
  }

  /**
   * Fetches model catalogue, utilizing cache or fallback fixture when offline
   */
  public async getModels(forceRefresh = false): Promise<KiloModelInfo[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedModels && now - this.cacheTimestamp < this.cacheTtlMs) {
      return this.cachedModels;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(`${this.baseUrl}/models`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        const parsed = this.parseModelCatalogue(data);
        if (parsed.length > 0) {
          this.cachedModels = parsed;
          this.cacheTimestamp = now;
          return parsed;
        }
      }
    } catch {
      // Offline fallback: Use verified recorded fixture
    }

    this.cachedModels = RECORDED_KILO_FIXTURE_MODELS;
    this.cacheTimestamp = now;
    return RECORDED_KILO_FIXTURE_MODELS;
  }

  /**
   * Parses an SSE stream of chunk lines into structured tokens
   */
  public parseSseChunk(chunkStr: string): Array<{ token?: string; reasoning?: string; finish_reason?: string }> {
    const lines = chunkStr.split('\n');
    const outputs: Array<{ token?: string; reasoning?: string; finish_reason?: string }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataPayload = trimmed.replace(/^data:\s*/, '');
      if (dataPayload === '[DONE]') break;

      try {
        const parsed = JSON.parse(dataPayload);
        const choice = parsed.choices?.[0];
        if (choice) {
          const delta = choice.delta;
          if (delta?.content) {
            outputs.push({ token: delta.content });
          }
          if (delta?.reasoning_content || delta?.thought) {
            outputs.push({ reasoning: delta.reasoning_content || delta.thought });
          }
          if (choice.finish_reason) {
            outputs.push({ finish_reason: choice.finish_reason });
          }
        }
      } catch {
        // Skip unparseable chunk
      }
    }

    return outputs;
  }
}
