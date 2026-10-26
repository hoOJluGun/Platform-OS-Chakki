import React, { useState, useEffect } from 'react';
import { Header, ActiveTabType, UiMode } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { FileViewer } from './components/FileViewer';
import { InspectorPanel } from './components/InspectorPanel';
import { ProtocolSpecView } from './components/ProtocolSpecModal';
import { SettingsModal } from './components/SettingsModal';
import { LedgerView } from './components/LedgerView';
import { CommandsView } from './components/CommandsView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { SimpleChatView } from './components/SimpleChatView';
import { WebsiteView } from './components/WebsiteView';

import {
  ChatMessage,
  FileItem,
  TaskStatus,
  JsonRpcPacketLog,
  ConnectionMode,
  ToolCallState,
} from './types/protocol';
import { INITIAL_WORKSPACE_FILES } from './data/mockFiles';
import { globalSwiftBridge } from './engine/swiftBridge';
import {
  applyToolCallToMessages,
  appendReasoningToMessages,
  appendContentToMessages,
} from './engine/protocol';

import { CanonicalLedger } from './core/ledger';
import { CommandRegistry } from './core/commands';
import { KiloGatewayClient } from './core/kiloGateway';

const masterCommandRegistry = new CommandRegistry();
const masterKiloClient = new KiloGatewayClient();

const AVAILABLE_MODELS = [
  { id: 'kilo-auto/free', name: 'Kilo Auto (Free Route)', isFree: true },
  { id: 'reflection/beam-free', name: 'Reflection Beam (Free Route)', isFree: true },
  { id: 'nvidia/nemotron-3.5-super-vl:free', name: 'Nvidia Nemotron 3.5 Super VL (Free)', isFree: true },
  { id: 'anthropic/claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Reasoning)', isFree: false },
  { id: 'openai/gpt-4o', name: 'GPT-4o (Omni)', isFree: false },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct (Free)', isFree: true },
];

export default function App() {
  const [uiMode, setUiMode] = useState<UiMode>('simple');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('workspace');
  const [files, setFiles] = useState<FileItem[]>(INITIAL_WORKSPACE_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [originalFileContent, setOriginalFileContent] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('kilo-auto/free');
  const [agentMode, setAgentMode] = useState<'director' | 'chat' | 'plan' | 'build' | 'review' | 'autopilot'>('director');
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high' | 'max'>('medium');
  const [sessions, setSessions] = useState([
    {
      id: 'session_chakki_primary',
      name: 'Primary Engineering Session',
      createdAt: Date.now() - 3600000,
      messageCount: 3,
      active: true,
    },
    {
      id: 'session_kilo_routing',
      name: 'Kilo Gateway & Models Audit',
      createdAt: Date.now() - 7200000,
      messageCount: 8,
      active: false,
    },
    {
      id: 'session_security_patch',
      name: 'Attestation & Anti-Replay Nonce',
      createdAt: Date.now() - 14400000,
      messageCount: 5,
      active: false,
    },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('session_chakki_primary');
  const [jsonRpcLogs, setJsonRpcLogs] = useState<JsonRpcPacketLog[]>([]);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulated');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Canonical SHA-256 Event Ledger instance
  const [ledger] = useState<CanonicalLedger>(() => {
    const l = new CanonicalLedger('session_chakki_primary');
    l.append('session.created', 'engine', {
      session_name: 'Primary Engineering Session',
      engine_version: '2.0.0',
    });
    return l;
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize selected file to Attestation.swift on mount
  useEffect(() => {
    const findFile = (items: FileItem[], path: string): FileItem | null => {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const found = findFile(item.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    const target = findFile(INITIAL_WORKSPACE_FILES, 'Sources/ChakkiEngine/Security/Attestation.swift');
    if (target) {
      setSelectedFile(target);
      setOriginalFileContent(target.content);
    }
  }, []);

  // Global keyboard shortcut Ctrl+K to open Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hook up Swift Engine Bridge Event & Log listeners
  useEffect(() => {
    const unsubLog = globalSwiftBridge.onLog((log) => {
      setJsonRpcLogs((prev) => [log, ...prev].slice(0, 300));
    });

    const unsubEvent = globalSwiftBridge.onEvent((method, params) => {
      if (method === 'task.started') {
        setTaskStatus('planning');
        setStatusMessage('Swift core initializing AST context...');
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_asst_${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          },
        ]);
        ledger.append('task.started', 'engine', params);
      } else if (method === 'task.status_changed') {
        setTaskStatus(params.status);
        if (params.message) setStatusMessage(params.message);
        ledger.append('task.progress', 'engine', params);
      } else if (method === 'task.reasoning_chunk') {
        setMessages((prev) => appendReasoningToMessages(prev, params.chunk));
      } else if (method === 'task.token_chunk') {
        setMessages((prev) => appendContentToMessages(prev, params.chunk));
      } else if (method === 'task.tool_requested') {
        const toolCall: ToolCallState = {
          id: params.toolCallId,
          toolName: params.toolName,
          args: params.args,
          requiresApproval: params.requiresApproval,
          status: params.requiresApproval ? 'pending_approval' : 'running',
          riskLevel: params.riskLevel,
          diff: params.diff,
          createdAt: Date.now(),
        };

        setMessages((prev) => applyToolCallToMessages(prev, toolCall));
        ledger.append('tool.requested', 'engine', params);

        if (params.diff?.filePath) {
          const filePath = params.diff.filePath;
          setFiles((prevFiles) => {
            const updateItem = (items: FileItem[]): FileItem[] => {
              return items.map((item) => {
                if (item.path === filePath) {
                  return { ...item, modified: true };
                }
                if (item.children) {
                  return { ...item, children: updateItem(item.children) };
                }
                return item;
              });
            };
            return updateItem(prevFiles);
          });
        }
      } else if (method === 'task.tool_started') {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg || !lastMsg.toolCalls) return prev;
          const updatedCalls = lastMsg.toolCalls.map((tc) =>
            tc.id === params.toolCallId ? { ...tc, status: 'running' as const } : tc
          );
          const copy = [...prev];
          copy[copy.length - 1] = { ...lastMsg, toolCalls: updatedCalls };
          return copy;
        });
        ledger.append('tool.started', 'engine', params);
      } else if (method === 'task.tool_completed') {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg || !lastMsg.toolCalls) return prev;
          const updatedCalls = lastMsg.toolCalls.map((tc) =>
            tc.id === params.toolCallId
              ? {
                  ...tc,
                  status: (params.exitCode === 0 ? 'completed' : 'failed') as any,
                  result: {
                    output: params.output,
                    exitCode: params.exitCode,
                    durationMs: params.durationMs,
                  },
                }
              : tc
          );
          const copy = [...prev];
          copy[copy.length - 1] = { ...lastMsg, toolCalls: updatedCalls };
          return copy;
        });
        ledger.append('tool.completed', 'engine', params);

        if (params.toolName === 'file_patch' && params.exitCode === 0) {
          setFiles((prevFiles) => {
            const patchTarget = (items: FileItem[]): FileItem[] => {
              return items.map((item) => {
                if (item.path === 'Sources/ChakkiEngine/Security/Attestation.swift') {
                  const updatedContent = `import Foundation
import Crypto

public struct AttestationToken {
    public let keyID: String
    public let nonce: String
    public let timestamp: TimeInterval
    public let signature: Data
    
    public func isValid(windowSeconds: TimeInterval = 180, seenNonces: inout Set<String>) -> Bool {
        let current = Date().timeIntervalSince1970
        guard abs(current - timestamp) <= windowSeconds else { return false }
        guard !seenNonces.contains(nonce) else { return false } // Anti-replay
        seenNonces.insert(nonce)
        return true
    }
}

public final class HardwareAttestation {
    public static func verifyClientSignature(token: AttestationToken, clientHash: Data) -> Bool {
        // Enforce cryptographic check against macOS Secure Enclave
        var nonces = Set<String>()
        return token.isValid(seenNonces: &nonces)
    }
}
`;
                  const updatedItem = { ...item, content: updatedContent, modified: true };
                  setSelectedFile(updatedItem);
                  return updatedItem;
                }
                if (item.children) {
                  return { ...item, children: patchTarget(item.children) };
                }
                return item;
              });
            };
            return patchTarget(prevFiles);
          });
        }
      } else if (method === 'task.completed') {
        setTaskStatus('completed');
        setStatusMessage('Task completed successfully');
        ledger.append('task.completed', 'engine', params);
      }
    });

    return () => {
      unsubLog();
      unsubEvent();
    };
  }, [ledger]);

  const handleStartTask = async (promptText: string) => {
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    ledger.append('task.queued', 'user', { prompt: promptText });

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId ? { ...s, messageCount: s.messageCount + 1 } : s
      )
    );

    // If command starts with slash, execute directly via CommandRegistry
    if (promptText.startsWith('/')) {
      const cmdResult = await masterCommandRegistry.execute(promptText, engineContext);
      if (promptText.startsWith('/mode')) {
        const parts = promptText.trim().split(/\s+/);
        if (parts[1] && ['director', 'chat', 'plan', 'build', 'review', 'autopilot'].includes(parts[1])) {
          setAgentMode(parts[1] as any);
        }
      }
      const asstMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: cmdResult.message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, asstMsg]);
      ledger.append('task.completed', 'engine', cmdResult);
      return;
    }

    const taskId = globalSwiftBridge.startTask(
      promptText,
      selectedModel,
      [],
      reasoningEffort,
      agentMode
    );
    setCurrentTaskId(taskId);
  };

  const handleNewSession = () => {
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      name: `Session #${sessions.length + 1}`,
      createdAt: Date.now(),
      messageCount: 0,
      active: true,
    };
    setSessions((prev) => [newSession, ...prev.map((s) => ({ ...s, active: false }))]);
    setCurrentSessionId(newId);
    setMessages([]);
    ledger.append('session.created', 'engine', { session_id: newId, created_at: Date.now() });
  };

  const handleSelectSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => ({ ...s, active: s.id === sessionId }))
    );
    setCurrentSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) return;
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (currentSessionId === sessionId && remaining[0]) {
      handleSelectSession(remaining[0].id);
    }
  };

  const handleApproveTool = (toolCallId: string, approved: boolean) => {
    if (!currentTaskId) return;

    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (!lastMsg || !lastMsg.toolCalls) return prev;
      const updatedCalls = lastMsg.toolCalls.map((tc) =>
        tc.id === toolCallId ? { ...tc, status: approved ? ('approved' as const) : ('rejected' as const) } : tc
      );
      const copy = [...prev];
      copy[copy.length - 1] = { ...lastMsg, toolCalls: updatedCalls };
      return copy;
    });

    ledger.append(approved ? 'tool.approved' : 'tool.rejected', 'user', { toolCallId, approved });
    globalSwiftBridge.approveTool(currentTaskId, toolCallId, approved);
  };

  const handleCancelTask = () => {
    if (currentTaskId) {
      globalSwiftBridge.cancelTask(currentTaskId);
      setTaskStatus('cancelled');
      setStatusMessage('Task cancelled by operator');
      ledger.append('task.cancelled', 'user', { taskId: currentTaskId });
    }
  };

  const handleSelectFile = (file: FileItem) => {
    setSelectedFile(file);
    if (!file.modified) {
      setOriginalFileContent(file.content);
    }
  };

  const handleNewTaskClick = () => {
    setActiveTab('workspace');
    handleStartTask(
      'Audit Sources/ChakkiEngine/Security/Attestation.swift for replay vulnerabilities, apply required patches, and run test verification.'
    );
  };

  const isTaskRunning =
    taskStatus === 'planning' ||
    taskStatus === 'thinking' ||
    taskStatus === 'executing_tool' ||
    taskStatus === 'awaiting_approval' ||
    taskStatus === 'verifying';

  const engineContext = {
    currentSessionId: ledger.sessionId,
    kiloClient: masterKiloClient,
    cancelActiveTask: handleCancelTask,
    setMode: (mode: string) => setStatusMessage(`Mode set to ${mode}`),
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Bar (3-Zone Contract with Mode Switcher) */}
      <Header
        uiMode={uiMode}
        setUiMode={setUiMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionMode={connectionMode}
        onNewTaskClick={handleNewTaskClick}
        isTaskRunning={isTaskRunning}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Simple Mode (Default clean focused workspace) */}
        {uiMode === 'simple' && (
          <SimpleChatView
            messages={messages}
            taskStatus={taskStatus}
            statusMessage={statusMessage}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={AVAILABLE_MODELS}
            agentMode={agentMode}
            setAgentMode={setAgentMode}
            reasoningEffort={reasoningEffort}
            setReasoningEffort={setReasoningEffort}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onSendMessage={handleStartTask}
            onCancelTask={handleCancelTask}
            onApproveTool={handleApproveTool}
            onSwitchToStudio={() => setUiMode('studio')}
          />
        )}

        {/* Website & Installation Funnel */}
        {uiMode === 'website' && (
          <div className="flex-1 h-full overflow-hidden">
            <WebsiteView onOpenApp={() => setUiMode('studio')} />
          </div>
        )}

        {/* Studio Mode (Full IDE with multi-pane layout & tabs) */}
        {uiMode === 'studio' && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {activeTab === 'workspace' && (
              <div className="flex-1 flex w-full h-full overflow-hidden">
                {/* Left: Sidebar (File Explorer & Directives) */}
                <Sidebar
                  files={files}
                  selectedPath={selectedFile?.path || null}
                  onSelectFile={handleSelectFile}
                  onRunPresetTask={handleStartTask}
                  isTaskRunning={isTaskRunning}
                />

                {/* Center: Chat & Task Execution Timeline */}
                <ChatPanel
                  messages={messages}
                  taskStatus={taskStatus}
                  statusMessage={statusMessage}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  onSendMessage={handleStartTask}
                  onCancelTask={handleCancelTask}
                  onApproveTool={handleApproveTool}
                />

                {/* Right: File Viewer & Diff Inspector */}
                <div className="w-[420px] lg:w-[480px] h-full hidden md:block">
                  <FileViewer file={selectedFile} originalContent={originalFileContent} />
                </div>
              </div>
            )}

            {activeTab === 'commands' && (
              <div className="flex-1 h-full">
                <CommandsView
                  registry={masterCommandRegistry}
                  engineContext={engineContext}
                />
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="flex-1 h-full">
                <LedgerView ledger={ledger} />
              </div>
            )}

            {activeTab === 'inspector' && (
              <div className="flex-1 h-full">
                <InspectorPanel
                  logs={jsonRpcLogs}
                  onClearLogs={() => setJsonRpcLogs([])}
                />
              </div>
            )}

            {activeTab === 'spec' && (
              <div className="flex-1 h-full">
                <ProtocolSpecView />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 h-full">
                <SettingsModal
                  connectionMode={connectionMode}
                  onUpdateConnectionMode={(mode, url) => {
                    setConnectionMode(mode);
                    globalSwiftBridge.setMode(mode, url);
                  }}
                  onClose={() => setActiveTab('workspace')}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 28-Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        registry={masterCommandRegistry}
        engineContext={engineContext}
        onCommandOutput={(out) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `cmd_out_${Date.now()}`,
              role: 'system',
              content: out,
              timestamp: Date.now(),
            },
          ]);
        }}
      />
    </div>
  );
}
