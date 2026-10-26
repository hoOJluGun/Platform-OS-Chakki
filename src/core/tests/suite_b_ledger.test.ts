import test from 'node:test';
import assert from 'node:assert/strict';
import { CanonicalLedger, GENESIS_HASH, scrubCredentials } from '../ledger';

test('Suite B [Ledger]: Monotonic sequence numbering and unbroken SHA-256 chain', () => {
  const ledger = new CanonicalLedger('sess_suite_b');
  const e1 = ledger.append('task.started', 'user', { prompt: 'Verify invariant' });
  const e2 = ledger.append('task.progress', 'engine', { step: 'AST loaded' });
  const e3 = ledger.append('task.completed', 'engine', { summary: 'Pass' });

  assert.equal(e1.event_seq, 1);
  assert.equal(e2.event_seq, 2);
  assert.equal(e3.event_seq, 3);

  assert.equal(e1.prev_hash, GENESIS_HASH);
  assert.equal(e2.prev_hash, e1.current_hash);
  assert.equal(e3.prev_hash, e2.current_hash);

  const verification = CanonicalLedger.verifyLedgerIntegrity(ledger.getEvents());
  assert.equal(verification.valid, true);
});

test('Suite B [Ledger]: Tamper detection detects content tampering in event stream', () => {
  const ledger = new CanonicalLedger('sess_tamper');
  ledger.append('task.started', 'user', { prompt: 'Valid work' });
  ledger.append('task.completed', 'engine', { status: 'success' });

  const events = JSON.parse(JSON.stringify(ledger.getEvents()));
  events[0].content = { prompt: 'Hacked prompt' };

  const verification = CanonicalLedger.verifyLedgerIntegrity(events);
  assert.equal(verification.valid, false);
  assert.ok(verification.error?.includes('Tampering detected'));
});

test('Suite B [Ledger]: Sensitive credentials are scrubbed before persistence', () => {
  const dirty = 'Authorization: Bearer topsecret1234567890 and key sk-ant-api03-abcdef12345678901234567890';
  const clean = scrubCredentials(dirty);
  assert.ok(!clean.includes('topsecret1234567890'));
  assert.ok(!clean.includes('sk-ant-api03-abcdef12345678901234567890'));
  assert.ok(clean.includes('[REDACTED_TOKEN]') || clean.includes('[REDACTED_API_KEY]'));
});

test('Suite B [Ledger]: JSONL export and import roundtrip preserves hash integrity', () => {
  const ledger = new CanonicalLedger('sess_jsonl_b');
  ledger.append('task.started', 'user', 'Run tests');
  ledger.append('task.completed', 'engine', '10/10 passed');

  const jsonl = ledger.exportJsonl();
  const imported = CanonicalLedger.fromJsonl(jsonl);

  assert.equal(imported.getEventCount(), 2);
  assert.equal(imported.getHeadHash(), ledger.getHeadHash());
  assert.equal(CanonicalLedger.verifyLedgerIntegrity(imported.getEvents()).valid, true);
});
