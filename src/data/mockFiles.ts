import { FileItem } from '../types/protocol';

export const INITIAL_WORKSPACE_FILES: FileItem[] = [
  {
    path: 'Package.swift',
    name: 'Package.swift',
    type: 'file',
    size: 924,
    language: 'swift',
    content: `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ChakkiEngine",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "chakki-core", targets: ["ChakkiEngine"])
    ],
    dependencies: [
        .package(url: "https://github.com/vapor/websocket-kit.git", from: "2.14.0"),
        .package(url: "https://github.com/apple/swift-crypto.git", from: "3.0.0")
    ],
    targets: [
        .executableTarget(
            name: "ChakkiEngine",
            dependencies: [
                .product(name: "WebSocketKit", package: "websocket-kit"),
                .product(name: "Crypto", package: "swift-crypto")
            ]
        ),
        .testTarget(
            name: "ChakkiEngineTests",
            dependencies: ["ChakkiEngine"]
        )
    ]
)
`,
  },
  {
    path: 'Sources',
    name: 'Sources',
    type: 'dir',
    children: [
      {
        path: 'Sources/ChakkiEngine',
        name: 'ChakkiEngine',
        type: 'dir',
        children: [
          {
            path: 'Sources/ChakkiEngine/main.swift',
            name: 'main.swift',
            type: 'file',
            size: 1420,
            language: 'swift',
            content: `import Foundation

print("[Chakki Core] Initializing Swift JSON-RPC 2.0 daemon...")
let server = EngineServer(port: 8765)
try server.start()
RunLoop.main.run()
`,
          },
          {
            path: 'Sources/ChakkiEngine/EngineServer.swift',
            name: 'EngineServer.swift',
            type: 'file',
            size: 3200,
            language: 'swift',
            content: `import Foundation
import WebSocketKit

public final class EngineServer {
    private let port: Int
    private var clients: [UUID: WebSocket] = [:]
    
    public init(port: Int = 8765) {
        self.port = port
    }
    
    public func start() throws {
        print("[EngineServer] Listening on ws://127.0.0.1:\\(port)")
        // JSON-RPC 2.0 dispatch loop
    }
    
    public func dispatchMessage(_ raw: String, from clientID: UUID) {
        guard let data = raw.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            sendError(code: -32700, message: "Parse error", clientID: clientID)
            return
        }
        
        let method = json["method"] as? String ?? ""
        let id = json["id"]
        
        switch method {
        case "engine.initialize":
            handleInitialize(params: json["params"], id: id, clientID: clientID)
        case "engine.start_task":
            handleStartTask(params: json["params"], id: id, clientID: clientID)
        case "engine.approve_tool":
            handleApproveTool(params: json["params"], id: id, clientID: clientID)
        default:
            sendError(code: -32601, message: "Method not found: \\(method)", clientID: clientID)
        }
    }
}
`,
          },
          {
            path: 'Sources/ChakkiEngine/Security',
            name: 'Security',
            type: 'dir',
            children: [
              {
                path: 'Sources/ChakkiEngine/Security/Attestation.swift',
                name: 'Attestation.swift',
                type: 'file',
                size: 2450,
                language: 'swift',
                content: `import Foundation
import Crypto

public struct AttestationToken {
    public let keyID: String
    public let timestamp: TimeInterval
    public let signature: Data
    
    public func isValid(windowSeconds: TimeInterval = 300) -> Bool {
        let current = Date().timeIntervalSince1970
        return abs(current - timestamp) <= windowSeconds
    }
}

public final class HardwareAttestation {
    public static func verifyClientSignature(token: AttestationToken, clientHash: Data) -> Bool {
        // Enforce cryptographic check against macOS Secure Enclave
        return token.isValid()
    }
}
`,
              },
            ],
          },
          {
            path: 'Sources/ChakkiEngine/Tools',
            name: 'Tools',
            type: 'dir',
            children: [
              {
                path: 'Sources/ChakkiEngine/Tools/BashExecutor.swift',
                name: 'BashExecutor.swift',
                type: 'file',
                size: 1890,
                language: 'swift',
                content: `import Foundation

public struct CommandResult {
    public let stdout: String
    public let exitCode: Int32
    public let durationMs: Int
}

public final class BashExecutor {
    public static func run(command: String, cwd: String = ".") throws -> CommandResult {
        let start = Date()
        let process = Process()
        let pipe = Pipe()
        
        process.executableURL = URL(fileURLWithPath: "/bin/bash")
        process.arguments = ["-c", command]
        process.currentDirectoryURL = URL(fileURLWithPath: cwd)
        process.standardOutput = pipe
        process.standardError = pipe
        
        try process.run()
        process.waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        let duration = Int(Date().timeIntervalSince(start) * 1000)
        
        return CommandResult(stdout: output, exitCode: process.terminationStatus, durationMs: duration)
    }
}
`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'config',
    name: 'config',
    type: 'dir',
    children: [
      {
        path: 'config/engine.json',
        name: 'engine.json',
        type: 'file',
        size: 412,
        language: 'json',
        content: `{
  "engine": "Chakki Swift Core",
  "version": "1.4.0",
  "port": 8765,
  "sandbox": {
    "enabled": true,
    "allowedTools": ["bash", "file_read", "file_write", "file_patch", "linter"],
    "requireApproval": {
      "bash": true,
      "file_write": true,
      "file_patch": false
    }
  },
  "rateLimit": {
    "maxRequestsPerMinute": 60,
    "tokenBudgetPerMinute": 150000
  }
}
`,
      },
    ],
  },
  {
    path: 'README.md',
    name: 'README.md',
    type: 'file',
    size: 1250,
    language: 'markdown',
    content: `# Chakki OS - Clean-Room Agent Platform

High-performance AI development agent built on Swift Core engine with JSON-RPC 2.0 interface.

## Architecture
- **Engine Core:** Swift 5.9 Headless Daemon (local-first, sandboxed)
- **Transport:** JSON-RPC 2.0 over WebSocket / Unix Domain Sockets
- **Client UI:** React 19 + TypeScript + Tailwind CSS (Tauri Desktop & Web)
- **Security:** Hardware Attestation, short-lived session tokens, explicit tool approvals
`,
  },
];
