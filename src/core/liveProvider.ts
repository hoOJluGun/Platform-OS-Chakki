import { KiloModelInfo } from './types';
import { KILO_DEFAULT_BASE_URL } from './kiloGateway';
import { scrubCredentials } from './ledger';

export interface LiveCompletionRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  reasoning_effort?: 'low' | 'medium' | 'high' | 'max';
}

export interface LiveCompletionResponse {
  id: string;
  model: string;
  content: string;
  reasoning?: string;
  latency_ms: number;
  finish_reason: string;
  cost?: string;
  request_id?: string;
  provider?: string;
}

/**
 * Sends a real HTTP request to Kilo AI Gateway.
 * Supports both direct gateway and local proxy (/api/kilo) to eliminate browser CORS obstacles.
 * Zero canned responses: performs actual network I/O.
 */
export async function sendLiveKiloCompletion(
  req: LiveCompletionRequest,
  baseUrl?: string
): Promise<LiveCompletionResponse> {
  const isBrowser = typeof window !== 'undefined';
  const candidateUrls: string[] = baseUrl
    ? [baseUrl]
    : isBrowser
    ? ['/api/kilo', KILO_DEFAULT_BASE_URL]
    : [KILO_DEFAULT_BASE_URL, 'http://127.0.0.1:3000/api/kilo'];

  let lastError: Error | null = null;

  for (const url of candidateUrls) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const payload: Record<string, unknown> = {
        model: req.model || 'kilo-auto/free',
        messages: req.messages.map((m) => ({
          role: m.role,
          content: scrubCredentials(m.content),
        })),
        temperature: req.temperature ?? 0.2,
        max_tokens: req.max_tokens ?? 2048,
      };

      if (req.reasoning_effort && req.reasoning_effort !== 'low') {
        payload.reasoning_effort = req.reasoning_effort;
      }

      const resp = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency_ms = Date.now() - start;
      const reqId = resp.headers.get('x-vercel-id') || resp.headers.get('x-request-id') || undefined;

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`HTTP ${resp.status} (${resp.statusText}): ${errText.slice(0, 250)}`);
      }

      const data = await resp.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || '';
      const reasoning = choice?.message?.reasoning || choice?.message?.reasoning_details?.[0]?.text;

      return {
        id: data.id || `kilo_${Date.now()}`,
        model: data.model || req.model,
        content,
        reasoning,
        latency_ms,
        finish_reason: choice?.finish_reason || 'stop',
        cost: data.choices?.[0]?.message?.provider_metadata?.gateway?.cost || '0',
        request_id: reqId,
        provider: data.choices?.[0]?.message?.provider_metadata?.gateway?.routing?.finalProvider,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      // Try next candidate endpoint if any
    }
  }

  throw new Error(`Kilo Gateway Request Failed: ${lastError?.message || 'Network unreachable'}`);
}
