import React, { useState } from 'react';
import { Database, ShieldCheck, AlertOctagon, Download, Check, Copy } from 'lucide-react';
import { CanonicalLedger } from '../core/ledger';

interface LedgerViewProps {
  ledger: CanonicalLedger;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ ledger }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [tampered, setTampered] = useState(false);

  const events = ledger.getEvents();

  const handleVerify = () => {
    const res = CanonicalLedger.verifyLedgerIntegrity(events);
    setVerificationResult(res);
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExport = () => {
    const jsonl = ledger.exportJsonl();
    const blob = new Blob([jsonl], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chakki-session-${ledger.sessionId}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden text-xs">
      {/* Header bar */}
      <div className="px-6 py-3 bg-[#0d121f] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Canonical SHA-256 Hash-Chained Event Ledger</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Session: {ledger.sessionId} · {events.length} records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerify}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1.5 font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Integrity</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1.5 transition-colors font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSONL</span>
          </button>
        </div>
      </div>

      {/* Verification status banner if verified */}
      {verificationResult && (
        <div
          className={`px-6 py-2 border-b flex items-center justify-between font-mono text-xs ${
            verificationResult.valid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {verificationResult.valid ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {verificationResult.valid
                ? `Cryptographic Head Verified: All ${events.length} events unbroken from Genesis Hash.`
                : `Integrity Failure: ${verificationResult.error}`}
            </span>
          </div>
          <span className="text-[11px] opacity-70">
            Head SHA-256: {ledger.getHeadHash().slice(0, 16)}...
          </span>
        </div>
      )}

      {/* Events table / ledger list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            Ledger is empty. Start a task to commit canonical records.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.event_id}
              className="p-3 rounded border border-slate-800 bg-[#070a12] space-y-2 hover:border-slate-700 transition-colors font-mono text-[11px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                    #{evt.event_seq}
                  </span>
                  <span className="font-semibold text-slate-200">{evt.kind}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 uppercase text-[10px]">{evt.role}</span>
                </div>

                <span className="text-slate-500 text-[10px]">
                  {new Date(evt.timestamp).toISOString()}
                </span>
              </div>

              {/* Hash Chain metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/60 text-[10px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>prev_hash:</span>
                  <div className="flex items-center gap-1 font-mono text-slate-500">
                    <span>{evt.prev_hash.slice(0, 16)}...</span>
                    <button
                      onClick={() => handleCopy(evt.prev_hash)}
                      className="hover:text-slate-300"
                    >
                      {copiedHash === evt.prev_hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>current_hash:</span>
                  <div className="flex items-center gap-1 font-mono text-amber-400/90 font-semibold">
                    <span>{evt.current_hash.slice(0, 16)}...</span>
                    <button
                      onClick={() => handleCopy(evt.current_hash)}
                      className="hover:text-slate-300"
                    >
                      {copiedHash === evt.current_hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Content preview */}
              <div className="p-2 rounded bg-[#05070d] text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap max-h-24">
                {typeof evt.content === 'string' ? evt.content : JSON.stringify(evt.content, null, 2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
