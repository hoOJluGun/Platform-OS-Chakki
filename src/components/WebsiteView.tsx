import React, { useState } from 'react';
import {
  Download,
  Terminal,
  Shield,
  BookOpen,
  ArrowRight,
  Check,
  Copy,
  Laptop,
  Cpu,
  Layers,
  Sparkles,
  History,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export type WebsiteRoute =
  | '/install'
  | '/cli'
  | '/desktop'
  | '/extensions'
  | '/security'
  | '/docs'
  | '/changelog';

export const WebsiteView: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => {
  const [activeRoute, setActiveRoute] = useState<WebsiteRoute>('/install');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#080c16] text-slate-100 overflow-y-auto">
      {/* Website Top Nav */}
      <header className="flex items-center justify-between px-8 py-3.5 bg-[#0b0f19] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs tracking-wider">
            CH
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-sm">Chakki Platform</span>
            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              v2.0.0
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-5 text-xs text-slate-300">
          <button
            onClick={() => setActiveRoute('/install')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/install'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Install
          </button>
          <button
            onClick={() => setActiveRoute('/cli')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/cli'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            CLI / TUI
          </button>
          <button
            onClick={() => setActiveRoute('/desktop')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/desktop'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setActiveRoute('/extensions')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/extensions'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Extensions
          </button>
          <button
            onClick={() => setActiveRoute('/security')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/security'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveRoute('/docs')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/docs'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Docs
          </button>
          <button
            onClick={() => setActiveRoute('/changelog')}
            className={`transition-colors pb-0.5 ${
              activeRoute === '/changelog'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            Changelog
          </button>
        </nav>

        <button
          onClick={onOpenApp}
          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <span>Launch Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <div className="py-10 px-8 max-w-5xl mx-auto text-center space-y-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Canonical AI Engineering Platform v2.0
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-2xl mx-auto">
          Developer autonomy meets canonical cryptographic truth.
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          One canonical execution engine. Deterministic SHA-256 event ledger. Kilo Gateway live model routing. Zero simulated responses.
        </p>

        {/* Quick Install Banner */}
        <div className="max-w-xl mx-auto pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d121f] border border-slate-800 font-mono text-xs text-slate-300 shadow-md">
            <span className="text-amber-400 select-none mr-2">$</span>
            <span className="flex-1 text-left truncate">curl -fsSL https://chakki.ai/install.sh | sh</span>
            <button
              onClick={() => handleCopy('curl -fsSL https://chakki.ai/install.sh | sh')}
              className="ml-3 p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copiedCmd === 'curl -fsSL https://chakki.ai/install.sh | sh' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Route Content */}
      <div className="max-w-5xl mx-auto px-8 pb-16 w-full flex-1">
        {activeRoute === '/install' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Installation Channels</h2>
                <p className="text-xs text-slate-400">
                  Select your primary operating environment or development client.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Release 2.0.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121f] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Laptop className="w-4 h-4 text-amber-400" />
                    <span>Chakki Studio (macOS)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                    Universal
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Universal DMG / App package for Apple Silicon (M1-M4) and Intel x86_64.
                </p>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  brew install chakki/tap/chakki-studio
                </div>
                <div className="text-[10px] text-slate-400 font-mono">SHA-256: 4f98...d71c (Signed & Notarized)</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121f] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Chakki CLI / TUI</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                    Linux / Darwin
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Autonomous terminal runtime with streaming SSE and 28 built-in commands.
                </p>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  npm install -g chakki-cli
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">Executable: /bin/chakki.js (Verified)</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121f] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>IDE Extensions</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                    VSCode & IDEA
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Thin clients for VS Code / Cursor (.vsix) and JetBrains IntelliJ (.zip).
                </p>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  code --install-extension chakki.vsix
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">Artifact: extensions/vscode/ & jetbrains/</div>
              </div>
            </div>
          </div>
        )}

        {activeRoute === '/cli' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Chakki Terminal Engine (CLI / TUI)</h2>
            <p className="text-xs text-slate-400">
              Direct access to the 28-command registry, live Kilo Gateway models, and canonical ledger.
            </p>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
              <div>
                <span className="text-slate-500"># 1. Run full subsystem diagnostics</span>
                <div className="text-amber-400 mt-0.5">$ chakki doctor</div>
              </div>
              <div>
                <span className="text-slate-500"># 2. Query live Kilo models (free routes only)</span>
                <div className="text-amber-400 mt-0.5">$ chakki models --free</div>
              </div>
              <div>
                <span className="text-slate-500"># 3. Start autonomous task with review approval</span>
                <div className="text-amber-400 mt-0.5">$ chakki run &quot;Audit security invariants and generate unified patch&quot;</div>
              </div>
              <div>
                <span className="text-slate-500"># 4. Inspect canonical ledger history</span>
                <div className="text-amber-400 mt-0.5">$ chakki history 1</div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] text-xs space-y-2">
              <span className="font-semibold text-white">Terminal Command Contract</span>
              <p className="text-slate-400">
                The CLI dispatches directly to the canonical engine loop. It supports process group cancellation,
                isolated stdout/stderr streaming, and real exit code recording.
              </p>
            </div>
          </div>
        )}

        {activeRoute === '/desktop' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Chakki Studio Desktop Application</h2>
            <p className="text-xs text-slate-400">
              Professional dual-mode engineering environment with Simple Mode for focused tasks and Studio Mode for deep inspection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <span className="font-semibold text-amber-400">Simple Mode (Default)</span>
                <p className="text-slate-400 leading-relaxed">
                  Clean single-column workspace. Operator enters a task directive, views live execution tokens, reviews unified diffs, and approves or rejects atomic patches without cognitive clutter.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <span className="font-semibold text-cyan-400">Studio Mode (IDE Panes)</span>
                <p className="text-slate-400 leading-relaxed">
                  Comprehensive 4-pane IDE layout: Workspace File Tree, Live Task Timeline, File/Diff Viewer, Event Ledger Inspector, and JSON-RPC 2.0 packet debugger.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs space-y-2">
              <div className="text-slate-400 font-semibold">Distribution Packages & Checksums:</div>
              <div className="text-slate-300">
                • macOS (.dmg): <span className="text-amber-400">ChakkiStudio-2.0.0-universal.dmg</span> (SHA-256: 7f8a91...)
              </div>
              <div className="text-slate-300">
                • Linux (.tar.gz): <span className="text-amber-400">chakki-linux-x64-2.0.0.tar.gz</span> (SHA-256: 3c5e88...)
              </div>
              <div className="text-slate-300">
                • Windows (.exe): <span className="text-amber-400">ChakkiSetup-2.0.0-x64.exe</span> (Target build verified)
              </div>
            </div>
          </div>
        )}

        {activeRoute === '/extensions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Editor Extensions & IDE Integration</h2>
            <p className="text-xs text-slate-400">
              First-party thin clients connecting to the canonical engine daemon over JSON-RPC 2.0. Zero competing agent loops.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-400">VS Code Extension (VSIX)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">v2.0.0</span>
                </div>
                <p className="text-slate-400">
                  Thin client communicating over JSON-RPC 2.0. Renders agent timeline, live diffs, and approval prompts directly inside VS Code and Cursor.
                </p>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  Path: extensions/vscode/chakki-studio-2.0.0.vsix
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-400">JetBrains IntelliJ Plugin</span>
                  <span className="text-[10px] text-emerald-400 font-mono">v2.0.0</span>
                </div>
                <p className="text-slate-400">
                  Kotlin plugin manifest, tool window factory, and ChakkiRpcClient for IntelliJ IDEA, WebStorm, and PyCharm.
                </p>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  Path: extensions/jetbrains/src/main/kotlin/
                </div>
              </div>
            </div>
          </div>
        )}

        {activeRoute === '/security' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Security & Integrity Architecture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <span className="font-semibold text-amber-400">Path Jail Confinement</span>
                <p className="text-slate-400">
                  All filesystem operations are resolved against the verified workspace root. Path traversal escapes (../, symlinks) are terminated at execution time.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <span className="font-semibold text-emerald-400">SHA-256 Event Chain</span>
                <p className="text-slate-400">
                  Every user prompt, assistant response, and tool execution is cryptographically committed with prev_hash. No history is ever silently compacted.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <span className="font-semibold text-red-400">Egress Credential Scrubbing</span>
                <p className="text-slate-400">
                  API tokens, private keys, and authorization headers are scrubbed into [REDACTED_API_KEY] and [REDACTED_TOKEN] before ledger persistence.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <span className="font-semibold text-purple-400">Precondition Hash Validation</span>
                <p className="text-slate-400">
                  Atomic patches verify the expected SHA-256 content hash of the target file before applying changes, preventing race conditions and stale overwrites.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeRoute === '/docs' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Chakki Protocol Documentation</h2>
            <p className="text-xs text-slate-400">
              JSON-RPC 2.0 method specification and lifecycle event contracts.
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
              <div>
                <span className="text-emerald-400 font-bold">engine.initialize</span>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Establishes capability negotiation, client identification, and workspace root validation.
                </div>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">task.start</span>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Creates durable task record, initiates multi-agent planning, and starts provider stream.
                </div>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">engine.approve_tool</span>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Submits operator approval or rejection for a pending mutating tool call or unified diff.
                </div>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">engine.doctor</span>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Runs diagnostic checks across file permissions, Kilo Gateway connectivity, and ledger health.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeRoute === '/changelog' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Platform Release Notes</h2>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0d121f] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">v2.0.0 — Production Qualification</span>
                  <span className="text-slate-500 font-mono">Current Release</span>
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>Zero mock responses: live Kilo AI Gateway integration with real SSE streaming.</li>
                  <li>Two-mode architecture: Simple Mode default with instant Studio IDE toggle.</li>
                  <li>All 28 built-in slash commands operational with zero dummy handlers.</li>
                  <li>Monotonic SHA-256 hash-chained Canonical Event Ledger with credential scrubber.</li>
                  <li>JetBrains IntelliJ Kotlin thin client and VS Code VSIX extension.</li>
                  <li>Deterministic BM25 hybrid memory retrieval with session isolation.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
