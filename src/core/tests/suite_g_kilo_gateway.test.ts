import test from 'node:test';
import assert from 'node:assert/strict';
import { KiloGatewayClient, RECORDED_KILO_FIXTURE_MODELS } from '../kiloGateway';

test('Suite G [Kilo Gateway]: Correctly classifies free versus paid routes', () => {
  const client = new KiloGatewayClient();
  const catalogue = client.parseModelCatalogue({
    data: [
      { id: 'kilo-auto/free', pricing: { input: 0, output: 0 } },
      { id: 'reflection/beam-free', pricing: { input: '0', output: '0' } },
      { id: 'anthropic/claude-3-7-sonnet', pricing: { input: 0.000003, output: 0.000015 } },
    ],
  });

  assert.equal(catalogue[0].pricing.is_free, true);
  assert.equal(catalogue[1].pricing.is_free, true);
  assert.equal(catalogue[2].pricing.is_free, false);
});

test('Suite G [Kilo Gateway]: Parses Server-Sent Events (SSE) streaming chunks', () => {
  const client = new KiloGatewayClient();
  const rawSse = `
data: {"choices":[{"delta":{"role":"assistant"}}]}

data: {"choices":[{"delta":{"reasoning_content":"Step 1: Check security rules"}}]}

data: {"choices":[{"delta":{"content":"Verification complete."}}]}

data: {"choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
`;

  const parsed = client.parseSseChunk(rawSse);
  assert.ok(parsed.length >= 3);

  const reasoningEntry = parsed.find((p) => p.reasoning !== undefined);
  assert.ok(reasoningEntry);
  assert.equal(reasoningEntry.reasoning, 'Step 1: Check security rules');

  const contentEntry = parsed.find((p) => p.token !== undefined);
  assert.ok(contentEntry);
  assert.equal(contentEntry.token, 'Verification complete.');

  const finishEntry = parsed.find((p) => p.finish_reason !== undefined);
  assert.ok(finishEntry);
  assert.equal(finishEntry.finish_reason, 'stop');
});

test('Suite G [Kilo Gateway]: Recorded offline fixture provides deterministic model set', () => {
  assert.ok(RECORDED_KILO_FIXTURE_MODELS.length >= 4);
  const freeModels = RECORDED_KILO_FIXTURE_MODELS.filter((m) => m.pricing.is_free);
  assert.ok(freeModels.length >= 2, 'Fixture must contain at least 2 free models');
});
