import { sha256 } from './sha256';
import { LedgerEvent, LedgerEventKind } from './types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Scans string for common credentials and scrubs them
 */
export function scrubCredentials(text: string): string {
  if (!text) return text;
  return text
    .replace(/(Bearer\s+)[A-Za-z0-9_\-\.]{15,}/gi, '$1[REDACTED_TOKEN]')
    .replace(/(sk-[A-Za-z0-9_\-]{20,})/gi, '[REDACTED_API_KEY]')
    .replace(/(AZURE_[A-Z_]*KEY["']?\s*[:=]\s*["']?)[A-Za-z0-9_\-]{20,}/gi, '$1[REDACTED_KEY]')
    .replace(/(password["']?\s*[:=]\s*["']?)[^"'\s]{6,}/gi, '$1[REDACTED_PASSWORD]');
}

/**
 * Computes deterministic SHA-256 hash for a ledger event
 */
export function computeEventHash(
  schema_version: string,
  session_id: string,
  event_seq: number,
  event_id: string,
  kind: string,
  role: string,
  timestamp: number,
  contentStr: string,
  prev_hash: string
): string {
  const payload = `${schema_version}|${session_id}|${event_seq}|${event_id}|${kind}|${role}|${timestamp}|${contentStr}|${prev_hash}`;
  return sha256(payload);
}

export class CanonicalLedger {
  private events: LedgerEvent[] = [];
  private lastHash: string = GENESIS_HASH;
  private currentSeq: number = 0;
  public readonly sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Appends an event to the hash chain
   */
  public append<T>(
    kind: LedgerEventKind,
    role: LedgerEvent['role'],
    content: T,
    provenance?: LedgerEvent['provenance']
  ): LedgerEvent<T> {
    this.currentSeq += 1;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();

    // Serialize and scrub credentials from content representation
    const rawContentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const scrubbedStr = scrubCredentials(rawContentStr);
    const finalContent: T = typeof content === 'string' ? (scrubbedStr as any) : JSON.parse(scrubbedStr);

    const prev_hash = this.lastHash;
    const current_hash = computeEventHash(
      '2.0',
      this.sessionId,
      this.currentSeq,
      eventId,
      kind,
      role,
      timestamp,
      scrubbedStr,
      prev_hash
    );

    const event: LedgerEvent<T> = {
      schema_version: '2.0',
      session_id: this.sessionId,
      event_seq: this.currentSeq,
      event_id: eventId,
      kind,
      role,
      timestamp,
      content: finalContent,
      payload_length: scrubbedStr.length,
      prev_hash,
      current_hash,
      provenance,
    };

    this.events.push(event);
    this.lastHash = current_hash;
    return event;
  }

  public getEvents(): ReadonlyArray<LedgerEvent> {
    return this.events;
  }

  public getHeadHash(): string {
    return this.lastHash;
  }

  public getEventCount(): number {
    return this.events.length;
  }

  public getEventBySequence(seq: number): LedgerEvent | undefined {
    return this.events.find((e) => e.event_seq === seq);
  }

  public getEventById(id: string): LedgerEvent | undefined {
    return this.events.find((e) => e.event_id === id);
  }

  /**
   * Serializes ledger to JSONL (one JSON per line)
   */
  public exportJsonl(): string {
    return this.events.map((e) => JSON.stringify(e)).join('\n');
  }

  /**
   * Imports JSONL and reconstructs the verified state
   */
  public static fromJsonl(jsonl: string): CanonicalLedger {
    const lines = jsonl.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('Cannot import empty ledger');
    }

    const first = JSON.parse(lines[0]) as LedgerEvent;
    const ledger = new CanonicalLedger(first.session_id);

    for (let i = 0; i < lines.length; i++) {
      const parsed = JSON.parse(lines[i]) as LedgerEvent;
      ledger.events.push(parsed);
      ledger.currentSeq = parsed.event_seq;
      ledger.lastHash = parsed.current_hash;
    }

    // Verify cryptographic integrity immediately upon import
    const validation = CanonicalLedger.verifyLedgerIntegrity(ledger.events);
    if (!validation.valid) {
      throw new Error(`Corrupted ledger import: ${validation.error}`);
    }

    return ledger;
  }

  /**
   * Cryptographically verifies the entire hash chain
   */
  public static verifyLedgerIntegrity(events: ReadonlyArray<LedgerEvent>): { valid: boolean; error?: string } {
    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Check 1: Monotonic sequence
      if (event.event_seq !== i + 1) {
        return {
          valid: false,
          error: `Sequence gap detected: expected seq ${i + 1}, found ${event.event_seq}`,
        };
      }

      // Check 2: Prev hash matches
      if (event.prev_hash !== expectedPrevHash) {
        return {
          valid: false,
          error: `Hash chain broken at seq ${event.event_seq}: prev_hash does not match expected`,
        };
      }

      // Check 3: Recompute current hash
      const contentStr = typeof event.content === 'string' ? event.content : JSON.stringify(event.content);
      const computed = computeEventHash(
        event.schema_version,
        event.session_id,
        event.event_seq,
        event.event_id,
        event.kind,
        event.role,
        event.timestamp,
        contentStr,
        event.prev_hash
      );

      if (computed !== event.current_hash) {
        return {
          valid: false,
          error: `Tampering detected at seq ${event.event_seq}: current_hash does not match recomputed SHA-256`,
        };
      }

      expectedPrevHash = event.current_hash;
    }

    return { valid: true };
  }
}
