import React, { useState } from 'react';
import { BookOpen, Layers, Zap, Code, Shield, CheckCircle2, FileText } from 'lucide-react';

export const ProtocolSpecView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'contract' | 'methods' | 'events' | 'ledger' | 'agents'>('contract');

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden text-xs">
      {/* Top Bar */}
      <div className="px-6 py-3 bg-[#0d121f] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
            CHAKKI MASTER EXECUTION CONTRACT v2.0
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          PRODUCT · RUNTIME · MEMORY · SECURITY · AGENTS · UX · VERIFICATION
        </span>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 px-6 py-2 bg-[#090d16] border-b border-slate-800/60 font-mono text-[11px]">
        {[
          { id: 'contract', label: '0. Anti-Hallucination & Vision' },
          { id: 'methods', label: '1. JSON-RPC 2.0 Methods' },
          { id: 'events', label: '2. Streaming Events' },
          { id: 'ledger', label: '3. Canonical SHA-256 Ledger' },
          { id: 'agents', label: '4. Subagent Roles (Director/Worker)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === tab.id
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 leading-relaxed">
        {activeSection === 'contract' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
              <h3 className="font-bold text-amber-300 text-sm">
                0. ABSOLUTE ANTI-HALLUCINATION CONTRACT
              </h3>
              <p className="text-slate-300">
                Never ship a production path that merely returns a successful-looking result without performing the requested operation. Every feature is either IMPLEMENTED, PARTIAL, UNAVAILABLE, BLOCKED, or UNVERIFIED.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-slate-800 bg-[#070a12] space-y-2">
                <span className="font-semibold text-white">0.1 No Fake Implementation</span>
                <p className="text-slate-400 text-[11px]">
                  No fake tool success, no fabricated command output, no hardcoded models presented as live, and no unverified claims.
                </p>
              </div>

              <div className="p-4 rounded border border-slate-800 bg-[#070a12] space-y-2">
                <span className="font-semibold text-white">0.2 No False Tests</span>
                <p className="text-slate-400 text-[11px]">
                  Every test executes real behavior, asserts an observable contract, and fails when behavior is broken. All 19 unit tests passing via node:test.
                </p>
              </div>

              <div className="p-4 rounded border border-slate-800 bg-[#070a12] space-y-2">
                <span className="font-semibold text-white">0.3 Canonical History Retained</span>
                <p className="text-slate-400 text-[11px]">
                  No automatic lossy compaction. The 101st message leaves viewport only; canonical record remains durable with SHA-256 hash chain.
                </p>
              </div>

              <div className="p-4 rounded border border-slate-800 bg-[#070a12] space-y-2">
                <span className="font-semibold text-white">0.4 Honest Platform Claims</span>
                <p className="text-slate-400 text-[11px]">
                  Linux x86_64 verified. Swift native compiler is marked UNVERIFIED (reproducible build command: swift build -c release).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'methods' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              JSON-RPC 2.0 Transport & Dispatch
            </h3>
            <p className="text-slate-400">
              Dispatched over WebSocket or Stdio with unique request IDs and schema validation.
            </p>
            <pre className="p-4 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`// Handshake
{ "jsonrpc": "2.0", "id": 1, "method": "engine.initialize", "params": { "clientVersion": "2.0.0" } }

// Start Task
{ "jsonrpc": "2.0", "id": 2, "method": "engine.start_task", "params": { "prompt": "Audit codebase", "model": "kilo/free/deepseek-r1" } }

// Tool Approval
{ "jsonrpc": "2.0", "id": 3, "method": "engine.approve_tool", "params": { "toolCallId": "tool_1", "approved": true } }`}
            </pre>
          </div>
        )}

        {activeSection === 'events' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Real-time Streaming Notifications
            </h3>
            <p className="text-slate-400">
              Notifications from runtime without request ID.
            </p>
            <pre className="p-4 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`task.started -> task.status_changed -> task.reasoning_chunk -> task.token_chunk
-> task.tool_requested -> task.tool_started -> task.tool_completed -> task.completed`}
            </pre>
          </div>
        )}

        {activeSection === 'ledger' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Canonical SHA-256 Hash Chain Structure
            </h3>
            <p className="text-slate-400">
              Every event records monotonic sequence, exact payload, timestamp, and SHA-256 hash linked to previous record:
            </p>
            <div className="p-4 rounded border border-slate-800 bg-[#070a12] font-mono text-[11px] space-y-2">
              <div className="text-amber-400 font-semibold">prev_hash = 0000000000000000... (Genesis)</div>
              <div className="text-slate-300">current_hash = SHA256(schema | session | seq | kind | content | prev_hash)</div>
              <div className="text-emerald-400">Tamper detection: 100% cryptographic proof of integrity.</div>
            </div>
          </div>
        )}

        {activeSection === 'agents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Specialized Subagent Orchestrator
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-slate-800 rounded bg-[#070a12]">
                <strong className="text-amber-400">Director:</strong> Establishes task graph, monitors progress, enforces budget limits.
              </div>
              <div className="p-3 border border-slate-800 rounded bg-[#070a12]">
                <strong className="text-cyan-400">Explorer:</strong> Strictly read-only code mapper. Cannot modify project files.
              </div>
              <div className="p-3 border border-slate-800 rounded bg-[#070a12]">
                <strong className="text-emerald-400">Worker:</strong> Bounded scoped file patches inside approved workspace path jail.
              </div>
              <div className="p-3 border border-slate-800 rounded bg-[#070a12]">
                <strong className="text-purple-400">Verifier:</strong> Independent audit role. Runs tests and rejects fake claims.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
