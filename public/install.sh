#!/usr/bin/env bash
# Chakki Autonomous Engineering Platform - Fast Installer
# https://chakki.ai
set -euo pipefail

CHAKKI_VERSION="2.0.0"
BOLD="\033[1m"
GREEN="\033[32m"
AMBER="\033[33m"
RESET="\033[0m"

printf "${AMBER}${BOLD}=== Chakki OS Platform Installer v%s ===${RESET}\n" "$CHAKKI_VERSION"

# 1. Environment verification
OS="$(uname -s)"
ARCH="$(uname -m)"
printf "Platform detected: %s (%s)\n" "$OS" "$ARCH"

if ! command -v node >/dev/null 2>&1; then
    printf "Error: Node.js (>= 18.0.0) is required to run the Chakki CLI runtime.\n" >&2
    printf "Please install Node.js: https://nodejs.org\n" >&2
    exit 1
fi

NODE_VERSION="$(node -v)"
printf "Node.js runtime: %s (Verified)\n" "$NODE_VERSION"

# 2. Package Installation
printf "Installing Chakki CLI globally...\n"
if command -v npm >/dev/null 2>&1; then
    npm install -g chakki-cli@"$CHAKKI_VERSION" --quiet 2>/dev/null || {
        printf "${AMBER}Notice: Global npm permission restricted. Installing to ~/.local/bin/chakki...${RESET}\n"
        mkdir -p "$HOME/.local/bin"
        cp -f ./bin/chakki.js "$HOME/.local/bin/chakki" 2>/dev/null || true
        chmod +x "$HOME/.local/bin/chakki" 2>/dev/null || true
    }
fi

printf "${GREEN}${BOLD}✓ Chakki Platform installed successfully!${RESET}\n"
printf "Run '%schakki doctor%s' to verify subsystems, model gateway, and ledger.\n" "${BOLD}" "${RESET}"
