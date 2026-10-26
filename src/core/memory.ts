import { MemoryRecord, RetrievalResult } from './types';
import { CanonicalLedger } from './ledger';

export class DeterministicMemoryIndex {
  private records: Map<string, MemoryRecord> = new Map();
  private identifierIndex: Map<string, Set<string>> = new Map(); // identifier -> Set of record_ids
  private termDocFrequency: Map<string, number> = new Map(); // term -> number of docs containing term
  private totalDocs = 0;
  private totalDocLength = 0;
  private docLengths: Map<string, number> = new Map();

  // BM25 parameters
  private readonly k1 = 1.2;
  private readonly b = 0.75;

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\.\-\/\_]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  private extractIdentifiers(text: string): string[] {
    const ids: Set<string> = new Set();
    // Path match: e.g. Sources/ChakkiEngine/Security/Attestation.swift
    const paths = text.match(/[A-Za-z0-9_\.\-]+\/[A-Za-z0-9_\.\-\/]+/g) || [];
    for (const p of paths) ids.add(p);

    // Commit / SHA match: 7 to 64 hex chars
    const shas = text.match(/\b[0-9a-f]{7,64}\b/gi) || [];
    for (const s of shas) ids.add(s.toLowerCase());

    // Symbol match: e.g. functionNames(), struct AttestationToken
    const symbols = text.match(/\b[A-Za-z_][A-Za-z0-9_]{3,}\b/g) || [];
    for (const sym of symbols) ids.add(sym);

    return Array.from(ids);
  }

  public indexRecord(record: MemoryRecord) {
    if (this.records.has(record.record_id)) return;

    this.records.set(record.record_id, record);
    this.totalDocs++;

    const tokens = this.tokenize(record.text_content);
    const docLen = tokens.length;
    this.docLengths.set(record.record_id, docLen);
    this.totalDocLength += docLen;

    // Update term frequency
    const uniqueTokens = new Set(tokens);
    for (const term of uniqueTokens) {
      this.termDocFrequency.set(term, (this.termDocFrequency.get(term) || 0) + 1);
    }

    // Index structured identifiers
    const identifiers = this.extractIdentifiers(record.text_content);
    for (const id of identifiers) {
      const lower = id.toLowerCase();
      if (!this.identifierIndex.has(lower)) {
        this.identifierIndex.set(lower, new Set());
      }
      this.identifierIndex.get(lower)!.add(record.record_id);
    }
  }

  public getRecordByTurn(sessionId: string, turnNumber: number): MemoryRecord | undefined {
    for (const r of this.records.values()) {
      if (r.session_id === sessionId && r.turn_number === turnNumber) {
        return r;
      }
    }
    return undefined;
  }

  public search(query: string, sessionId: string, limit = 5): RetrievalResult[] {
    const results: RetrievalResult[] = [];
    const queryTokens = this.tokenize(query);
    const queryIdentifiers = this.extractIdentifiers(query);

    const avgDocLength = this.totalDocs > 0 ? this.totalDocLength / this.totalDocs : 1;

    // Check exact identifier matches first
    const exactMatches = new Set<string>();
    for (const qId of queryIdentifiers) {
      const matchSet = this.identifierIndex.get(qId.toLowerCase());
      if (matchSet) {
        for (const recordId of matchSet) {
          const rec = this.records.get(recordId);
          if (rec && rec.session_id === sessionId) {
            exactMatches.add(recordId);
          }
        }
      }
    }

    // Score documents for this session using BM25
    const candidateScores = new Map<string, number>();

    for (const [recordId, record] of this.records.entries()) {
      if (record.session_id !== sessionId) continue; // STRICT CROSS-SESSION ISOLATION

      const docLen = this.docLengths.get(recordId) || 1;
      let score = 0;

      // Exact match bonus
      if (exactMatches.has(recordId)) {
        score += 25.0;
      }

      // BM25 term calculation
      const tokens = this.tokenize(record.text_content);
      const termFreqs: Record<string, number> = {};
      for (const t of tokens) {
        termFreqs[t] = (termFreqs[t] || 0) + 1;
      }

      for (const qTerm of queryTokens) {
        const tf = termFreqs[qTerm] || 0;
        if (tf > 0) {
          const df = this.termDocFrequency.get(qTerm) || 1;
          const idf = Math.log(1 + (this.totalDocs - df + 0.5) / (df + 0.5));
          const num = tf * (this.k1 + 1);
          const den = tf + this.k1 * (1 - this.b + this.b * (docLen / avgDocLength));
          score += idf * (num / den);
        }
      }

      if (score > 0) {
        candidateScores.set(recordId, score);
      }
    }

    // Sort descending
    const sorted = Array.from(candidateScores.entries()).sort((a, b) => b[1] - a[1]);

    for (const [recId, score] of sorted.slice(0, limit)) {
      const rec = this.records.get(recId)!;
      results.push({
        record: rec,
        score,
        match_type: exactMatches.has(recId) ? 'exact_id' : 'bm25',
        excerpt: rec.text_content.slice(0, 160) + (rec.text_content.length > 160 ? '...' : ''),
      });
    }

    return results;
  }

  /**
   * Rebuilds index completely from canonical ledger
   */
  public static rebuildFromLedger(ledger: CanonicalLedger): DeterministicMemoryIndex {
    const memory = new DeterministicMemoryIndex();
    let turnCounter = 0;

    for (const event of ledger.getEvents()) {
      if (event.kind === 'task.started' || event.kind === 'tool.completed') {
        turnCounter++;
        const contentStr = typeof event.content === 'string' ? event.content : JSON.stringify(event.content);
        memory.indexRecord({
          record_id: `rec_${event.event_id}`,
          session_id: event.session_id,
          turn_number: turnCounter,
          event_seq: event.event_seq,
          role: event.role,
          text_content: contentStr,
          identifiers: memory.extractIdentifiers(contentStr),
          timestamp: event.timestamp,
        });
      }
    }

    return memory;
  }
}
